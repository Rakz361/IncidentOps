from app.core.database import SessionLocal
from app.core.database_locks import acquire_email_lock

db = SessionLocal()

try:
    acquire_email_lock(db, "lock.test@example.com")
    print("Email lock acquired successfully")

    db.commit()
    print("Transaction committed and lock released")

except Exception:
    db.rollback()
    print("Transaction rolled back")
    raise

finally:
    db.close()
    print("Database session closed")