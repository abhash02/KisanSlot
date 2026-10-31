import sys
import os
import argparse
import getpass
from pathlib import Path

# Ensure backend root is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.schemas.auth import normalize_mobile_number


def create_or_update_admin(
    name: str,
    mobile: str,
    password: str,
    village: str = "Admin HQ",
) -> None:
    """
    Creates or updates an administrator account securely.
    Ensures password is encrypted using Argon2 and never logged in plaintext.
    """
    try:
        canonical_mobile = normalize_mobile_number(mobile)
    except ValueError as e:
        print(f"[ERROR] Invalid mobile number: {e}")
        sys.exit(1)

    if len(password) < 6:
        print("[ERROR] Password must be at least 6 characters long.")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.mobile_number == canonical_mobile).first()
        hashed_password = get_password_hash(password)

        if user:
            print(f"[INFO] User with mobile {canonical_mobile} already exists. Updating role to ADMIN...")
            user.full_name = name
            user.password_hash = hashed_password
            user.role = "ADMIN"
            user.is_active = True
            db.commit()
            print(f"[SUCCESS] Admin account '{name}' ({canonical_mobile}) updated successfully.")
        else:
            admin_user = User(
                full_name=name,
                mobile_number=canonical_mobile,
                password_hash=hashed_password,
                role="ADMIN",
                village=village,
                preferred_language="hi",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"[SUCCESS] Admin user '{name}' ({canonical_mobile}) created with ID: {admin_user.id}")

    except Exception as exc:
        db.rollback()
        print(f"[ERROR] Database operation failed: {exc}")
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Securely create or promote an admin user for KisanSlot.")
    parser.add_argument("--name", help="Admin's full name")
    parser.add_argument("--mobile", help="Admin's 10-digit mobile number")
    parser.add_argument("--password", help="Admin's secure password (optional; can be prompted)")
    parser.add_argument("--village", default="Admin HQ", help="Administrative office/location")

    args = parser.parse_args()

    name = args.name or os.getenv("ADMIN_NAME")
    mobile = args.mobile or os.getenv("ADMIN_MOBILE")
    password = args.password or os.getenv("ADMIN_PASSWORD")

    # Interactive prompt if needed
    if not name:
        name = input("Enter Admin Full Name [System Admin]: ").strip() or "System Administrator"
    if not mobile:
        mobile = input("Enter Admin Mobile Number (10 digits): ").strip()
    if not password:
        password = getpass.getpass("Enter Admin Password (min 6 chars): ").strip()

    create_or_update_admin(name=name, mobile=mobile, password=password, village=args.village)


if __name__ == "__main__":
    main()

