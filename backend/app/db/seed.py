import os
import sys
from datetime import date, time, timedelta, datetime, timezone
from pathlib import Path

# Ensure backend root is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.centre import ProcurementCentre
from app.models.slot import ProcurementSlot
from app.models.booking import Booking
from app.models.history import BookingStatusHistory
from app.core.security import get_password_hash


def seed_demo_data():
    """
    Idempotent seed script that creates realistic fictional demo data for KisanSlot.
    Creates 3 demo procurement centres, future slots, demo accounts, and sample bookings.
    """
    db = SessionLocal()
    try:
        print("[SEED] Starting KisanSlot demo data seeding...")

        # 1. Admin Account (read from env or fallback to demo values)
        admin_mobile = os.getenv("DEMO_ADMIN_MOBILE", "7987285097")
        admin_pass = os.getenv("DEMO_ADMIN_PASSWORD", "Admin@123")
        admin_user = db.query(User).filter(User.mobile_number == admin_mobile).first()
        if not admin_user:
            admin_user = User(
                full_name="Admin Officer",
                mobile_number=admin_mobile,
                password_hash=get_password_hash(admin_pass),
                role="ADMIN",
                village="Admin Secretariat",
                preferred_language="hi",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"[SEED] Created demo Admin: {admin_mobile}")
        else:
            print(f"[SEED] Demo Admin {admin_mobile} already exists.")

        # 2. Farmers Accounts
        demo_farmers = [
            ("Rameshwar Patel (Demo)", "9876543210", "FarmerDemo123!", "Rampur"),
            ("Sunita Devi (Demo)", "9876543211", "FarmerDemo123!", "Kalyanpur"),
            ("Balwant Singh (Demo)", "9876543212", "FarmerDemo123!", "Fatehpur"),
        ]

        farmer_users = []
        for name, mobile, pwd, village in demo_farmers:
            f_user = db.query(User).filter(User.mobile_number == mobile).first()
            if not f_user:
                f_user = User(
                    full_name=name,
                    mobile_number=mobile,
                    password_hash=get_password_hash(pwd),
                    role="FARMER",
                    village=village,
                    preferred_language="hi",
                    is_active=True,
                )
                db.add(f_user)
                db.commit()
                db.refresh(f_user)
                print(f"[SEED] Created demo Farmer: {name} ({mobile})")
            else:
                print(f"[SEED] Demo Farmer {mobile} already exists.")
            farmer_users.append(f_user)

        # 3. Demo Procurement Centres (Clearly Fictional)
        demo_centres = [
            {
                "name": "Karnal Model Grain Mandi (Demo Hub)",
                "district": "Karnal",
                "address": "Near GT Road Bypass, Sector 4 Mandi Gate, Karnal",
                "notes": "Primary wheat and paddy procurement hub with 4 automated weighbridges.",
            },
            {
                "name": "Hisar Agricultural Logistics Yard (Demo Hub)",
                "district": "Hisar",
                "address": "Balsamand Road Mandi Complex, Hisar",
                "notes": "Equipped with electronic weighbridges and grain moisture testing labs.",
            },
            {
                "name": "Kurukshetra District Procurement Centre (Demo Hub)",
                "district": "Kurukshetra",
                "address": "Station Road Mandi Yard, Kurukshetra",
                "notes": "Dedicated mustard and wheat unloading bays with high throughput.",
            },
        ]

        centre_objs = []
        for c_data in demo_centres:
            centre = db.query(ProcurementCentre).filter(ProcurementCentre.name == c_data["name"]).first()
            if not centre:
                centre = ProcurementCentre(
                    name=c_data["name"],
                    district=c_data["district"],
                    address=c_data["address"],
                    notes=c_data["notes"],
                    is_active=True,
                )
                db.add(centre)
                db.commit()
                db.refresh(centre)
                print(f"[SEED] Created Centre: {centre.name}")
            else:
                print(f"[SEED] Centre {centre.name} already exists.")
            centre_objs.append(centre)

        # 4. Demo Slots for next 5 days
        today = date.today()
        slot_hours = [
            (time(8, 0), time(10, 0), 15),
            (time(10, 0), time(12, 0), 20),
            (time(13, 0), time(15, 0), 15),
            (time(15, 0), time(17, 0), 10),
        ]

        created_slots = []
        for centre in centre_objs:
            for day_offset in range(1, 6):
                slot_date = today + timedelta(days=day_offset)
                for start_t, end_t, cap in slot_hours:
                    existing_slot = (
                        db.query(ProcurementSlot)
                        .filter(
                            ProcurementSlot.centre_id == centre.id,
                            ProcurementSlot.slot_date == slot_date,
                            ProcurementSlot.start_time == start_t,
                        )
                        .first()
                    )
                    if not existing_slot:
                        new_slot = ProcurementSlot(
                            centre_id=centre.id,
                            slot_date=slot_date,
                            start_time=start_t,
                            end_time=end_t,
                            capacity=cap,
                            status="OPEN",
                            notes="Standard procurement window",
                        )
                        db.add(new_slot)
                        db.flush()
                        created_slots.append(new_slot)

        db.commit()
        print(f"[SEED] Ensured time slots across centres for upcoming 5 days.")

        # 5. Sample Bookings in Different Statuses
        # Find tomorrow's slots for centre 0
        tomorrow = today + timedelta(days=1)
        slots_tomorrow = (
            db.query(ProcurementSlot)
            .filter(
                ProcurementSlot.centre_id == centre_objs[0].id,
                ProcurementSlot.slot_date == tomorrow,
            )
            .order_by(ProcurementSlot.start_time)
            .all()
        )

        if slots_tomorrow and len(slots_tomorrow) >= 2:
            # Booking 1: BOOKED
            b1_token = f"KS-{tomorrow.strftime('%Y%m%d')}-DEMO01"
            if not db.query(Booking).filter(Booking.public_token == b1_token).first():
                b1 = Booking(
                    public_token=b1_token,
                    farmer_id=farmer_users[0].id,
                    slot_id=slots_tomorrow[0].id,
                    produce_type="Wheat",
                    quantity=45.0,
                    status="BOOKED",
                    queue_number=1,
                )
                db.add(b1)
                db.flush()
                h1 = BookingStatusHistory(
                    booking_id=b1.id,
                    actor_id=farmer_users[0].id,
                    old_status=None,
                    new_status="BOOKED",
                    note="Slot booked by farmer via KisanSlot",
                )
                db.add(h1)
                print(f"[SEED] Created sample booking (BOOKED): {b1_token}")

            # Booking 2: ARRIVED
            b2_token = f"KS-{tomorrow.strftime('%Y%m%d')}-DEMO02"
            if not db.query(Booking).filter(Booking.public_token == b2_token).first():
                b2 = Booking(
                    public_token=b2_token,
                    farmer_id=farmer_users[1].id,
                    slot_id=slots_tomorrow[0].id,
                    produce_type="Rice/Paddy",
                    quantity=60.0,
                    status="ARRIVED",
                    queue_number=2,
                )
                db.add(b2)
                db.flush()
                db.add(
                    BookingStatusHistory(
                        booking_id=b2.id,
                        actor_id=farmer_users[1].id,
                        old_status=None,
                        new_status="BOOKED",
                        note="Booking created",
                    )
                )
                db.add(
                    BookingStatusHistory(
                        booking_id=b2.id,
                        actor_id=admin_user.id,
                        old_status="BOOKED",
                        new_status="ARRIVED",
                        note="Farmer verified at security gate with vehicle",
                    )
                )
                print(f"[SEED] Created sample booking (ARRIVED): {b2_token}")

            # Booking 3: IN_SERVICE
            b3_token = f"KS-{tomorrow.strftime('%Y%m%d')}-DEMO03"
            if not db.query(Booking).filter(Booking.public_token == b3_token).first():
                b3 = Booking(
                    public_token=b3_token,
                    farmer_id=farmer_users[2].id,
                    slot_id=slots_tomorrow[1].id,
                    produce_type="Mustard",
                    quantity=30.0,
                    status="IN_SERVICE",
                    queue_number=1,
                )
                db.add(b3)
                db.flush()
                db.add(
                    BookingStatusHistory(
                        booking_id=b3.id,
                        actor_id=farmer_users[2].id,
                        old_status=None,
                        new_status="BOOKED",
                        note="Booking confirmed",
                    )
                )
                db.add(
                    BookingStatusHistory(
                        booking_id=b3.id,
                        actor_id=admin_user.id,
                        old_status="BOOKED",
                        new_status="ARRIVED",
                        note="Farmer entered Mandi",
                    )
                )
                db.add(
                    BookingStatusHistory(
                        booking_id=b3.id,
                        actor_id=admin_user.id,
                        old_status="ARRIVED",
                        new_status="IN_SERVICE",
                        note="Gross weight recorded; unloading commenced at bay 2",
                    )
                )
                print(f"[SEED] Created sample booking (IN_SERVICE): {b3_token}")

            # Booking 4: COMPLETED
            b4_token = f"KS-{tomorrow.strftime('%Y%m%d')}-DEMO04"
            if not db.query(Booking).filter(Booking.public_token == b4_token).first():
                b4 = Booking(
                    public_token=b4_token,
                    farmer_id=farmer_users[0].id,
                    slot_id=slots_tomorrow[1].id,
                    produce_type="Maize",
                    quantity=25.0,
                    status="COMPLETED",
                    queue_number=2,
                )
                db.add(b4)
                db.flush()
                db.add(
                    BookingStatusHistory(
                        booking_id=b4.id,
                        actor_id=farmer_users[0].id,
                        old_status=None,
                        new_status="BOOKED",
                        note="Booking created",
                    )
                )
                db.add(
                    BookingStatusHistory(
                        booking_id=b4.id,
                        actor_id=admin_user.id,
                        old_status="BOOKED",
                        new_status="ARRIVED",
                        note="Checked in",
                    )
                )
                db.add(
                    BookingStatusHistory(
                        booking_id=b4.id,
                        actor_id=admin_user.id,
                        old_status="ARRIVED",
                        new_status="IN_SERVICE",
                        note="Tare weight verified",
                    )
                )
                db.add(
                    BookingStatusHistory(
                        booking_id=b4.id,
                        actor_id=admin_user.id,
                        old_status="IN_SERVICE",
                        new_status="COMPLETED",
                        note="Procurement slip generated; transaction completed",
                    )
                )
                print(f"[SEED] Created sample booking (COMPLETED): {b4_token}")

        db.commit()
        print("\n[SUCCESS] KisanSlot demo dataset successfully seeded!")
        print("Demo Credentials:")
        print(f"  Admin:  Mobile = {admin_mobile} | Password = {admin_pass}")
        print("  Farmer: Mobile = 9876543210 | Password = FarmerDemo123! (Rameshwar Patel)")
        print("  Farmer: Mobile = 9876543211 | Password = FarmerDemo123! (Sunita Devi)")
        print("  Farmer: Mobile = 9876543212 | Password = FarmerDemo123! (Balwant Singh)")

    except Exception as exc:
        db.rollback()
        print(f"[ERROR] Seeding failed: {exc}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()

