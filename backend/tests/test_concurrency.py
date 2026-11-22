import json
from uuid import uuid4
from getpass import getpass
from threading import Barrier
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlparse, parse_qs


BASE_URL = "http://127.0.0.1:8000"
TEST_PASSWORD = "ConcurrencyTest@123"


def post(endpoint, data, token=None):
    """Send a POST request to the IncidentOps API."""

    headers = {
        "Content-Type": "application/json"
    }

    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = Request(
        url=f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urlopen(request, timeout=60) as response:
            return (
                response.status,
                json.loads(response.read().decode("utf-8"))
            )

    except HTTPError as error:
        return (
            error.code,
            json.loads(error.read().decode("utf-8"))
        )


def generate_test_email(prefix):
    """Generate a unique email for every test."""

    unique_id = uuid4().hex[:12]

    return f"{prefix}.{unique_id}@example.com"


def registration_data(email):
    return {
        "full_name": "Concurrency Test User",
        "email": email,
        "password": TEST_PASSWORD
    }


def invitation_data(email):
    return {
        "full_name": "Concurrency Test User",
        "email": email,
        "role": "responder"
    }


def login_admin():
    """Authenticate using administrator credentials."""

    email = input("Administrator email: ").strip()
    password = getpass("Administrator password: ")

    status, response = post(
        "/auth/login",
        {
            "email": email,
            "password": password
        }
    )

    if status != 200:
        raise RuntimeError("Administrator login failed")

    print("Administrator login successful")

    return response["access_token"]


def run_concurrent_requests(request_a, request_b):
    """Execute two HTTP requests concurrently."""

    barrier = Barrier(2, timeout=10)

    def execute(request_function):
        barrier.wait()
        return request_function()

    with ThreadPoolExecutor(max_workers=2) as executor:

        future_a = executor.submit(execute, request_a)
        future_b = executor.submit(execute, request_b)

        return [
            future_a.result(),
            future_b.result()
        ]


def verify_results(test_name, results, expected_codes):
    """Compare actual and expected HTTP status codes."""

    actual_codes = sorted(
        result[0] for result in results
    )

    expected_codes = sorted(expected_codes)

    passed = actual_codes == expected_codes

    print(f"\n{test_name}")
    print("-" * 50)

    for index, (status, response) in enumerate(
        results,
        start=1
    ):
        print(f"Request {index}: HTTP {status}")

        if status >= 400:
            print(
                "Message:",
                response.get("detail")
            )

    print(f"Expected: {expected_codes}")
    print(f"Actual:   {actual_codes}")
    print("Result:", "PASS" if passed else "FAIL")

    return passed


def create_test_invitation(email, admin_token):
    """Generate an invitation and extract its raw token."""

    status, response = post(
        "/admin/invitations",
        invitation_data(email),
        admin_token
    )

    if status != 201:
        raise RuntimeError(
            "Unable to create test invitation"
        )

    invitation_url = response["invitation_url"]

    parsed_url = urlparse(invitation_url)

    token = (
        parse_qs(parsed_url.fragment).get("token")
        or parse_qs(parsed_url.query).get("token")
    )

    if not token:
        raise RuntimeError(
            "Invitation token was not found"
        )

    return token[0]


def test_duplicate_registration():
    email = generate_test_email("race-registration")

    print(f"\nTest email: {email}")

    results = run_concurrent_requests(
        lambda: post(
            "/auth/register",
            registration_data(email)
        ),
        lambda: post(
            "/auth/register",
            registration_data(email)
        )
    )

    return verify_results(
        "TEST A - Concurrent Registration",
        results,
        [201, 409]
    )


def test_duplicate_invitation(admin_token):
    email = generate_test_email("race-invitation")

    print(f"\nTest email: {email}")

    results = run_concurrent_requests(
        lambda: post(
            "/admin/invitations",
            invitation_data(email),
            admin_token
        ),
        lambda: post(
            "/admin/invitations",
            invitation_data(email),
            admin_token
        )
    )

    return verify_results(
        "TEST B - Concurrent Invitation Creation",
        results,
        [201, 409]
    )


def test_registration_vs_invitation(admin_token):
    email = generate_test_email("race-mixed")

    print(f"\nTest email: {email}")

    results = run_concurrent_requests(
        lambda: post(
            "/auth/register",
            registration_data(email)
        ),
        lambda: post(
            "/admin/invitations",
            invitation_data(email),
            admin_token
        )
    )

    return verify_results(
        "TEST C - Registration vs Invitation",
        results,
        [201, 409]
    )


def test_duplicate_acceptance(admin_token):
    email = generate_test_email("race-acceptance")

    print(f"\nTest email: {email}")

    token = create_test_invitation(
        email,
        admin_token
    )

    data = {
        "token": token,
        "password": TEST_PASSWORD
    }

    results = run_concurrent_requests(
        lambda: post(
            "/invitations/accept",
            data
        ),
        lambda: post(
            "/invitations/accept",
            data
        )
    )

    return verify_results(
        "TEST D - Concurrent Invitation Acceptance",
        results,
        [201, 400]
    )


def test_acceptance_vs_registration(admin_token):
    email = generate_test_email("race-accept-register")

    print(f"\nTest email: {email}")

    token = create_test_invitation(
        email,
        admin_token
    )

    results = run_concurrent_requests(
        lambda: post(
            "/invitations/accept",
            {
                "token": token,
                "password": TEST_PASSWORD
            }
        ),
        lambda: post(
            "/auth/register",
            registration_data(email)
        )
    )

    status_test_passed = verify_results(
        "TEST E - Acceptance vs Registration",
        results,
        [201, 409]
    )

    # Acceptance must succeed, not public registration
    acceptance_succeeded = results[0][0] == 201
    registration_rejected = results[1][0] == 409

    print(
        "Correct operation succeeded:",
        acceptance_succeeded and registration_rejected
    )

    return (
        status_test_passed
        and acceptance_succeeded
        and registration_rejected
    )


def main():

    print("=" * 55)
    print("INCIDENTOPS - CONCURRENCY TEST SUITE")
    print("=" * 55)

    admin_token = login_admin()

    test_results = [
        test_duplicate_registration(),
        test_duplicate_invitation(admin_token),
        test_registration_vs_invitation(admin_token),
        test_duplicate_acceptance(admin_token),
        test_acceptance_vs_registration(admin_token)
    ]

    passed = sum(test_results)
    total = len(test_results)

    print("\n" + "=" * 55)
    print("FINAL TEST SUMMARY")
    print("=" * 55)

    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")

    if all(test_results):
        print("ALL CONCURRENCY TESTS PASSED")
    else:
        print("SOME CONCURRENCY TESTS FAILED")
        raise SystemExit(1)


if __name__ == "__main__":
    main()