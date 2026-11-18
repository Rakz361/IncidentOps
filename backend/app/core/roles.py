
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    INCIDENT_COMMANDER = "incident_commander"
    RESPONDER = "responder"
    VIEWER = "viewer"
