"""Initial schema for KisanSlot

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-29 19:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('mobile_number', sa.String(length=20), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='FARMER'),
        sa.Column('village', sa.String(length=100), nullable=True),
        sa.Column('preferred_language', sa.String(length=10), nullable=False, server_default='hi'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_mobile_number', 'users', ['mobile_number'], unique=True)

    # 2. procurement_centres
    op.create_table(
        'procurement_centres',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('district', sa.String(length=100), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_procurement_centres_name', 'procurement_centres', ['name'])
    op.create_index('ix_procurement_centres_district', 'procurement_centres', ['district'])

    # 3. procurement_slots
    op.create_table(
        'procurement_slots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('centre_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('procurement_centres.id', ondelete='CASCADE'), nullable=False),
        sa.Column('slot_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='OPEN'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('capacity > 0', name='check_positive_capacity'),
    )
    op.create_index('ix_procurement_slots_centre_id', 'procurement_slots', ['centre_id'])
    op.create_index('ix_procurement_slots_slot_date', 'procurement_slots', ['slot_date'])
    op.create_index('ix_procurement_slots_status', 'procurement_slots', ['status'])
    op.create_index('ix_procurement_slots_centre_date', 'procurement_slots', ['centre_id', 'slot_date'])

    # 4. bookings
    op.create_table(
        'bookings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('public_token', sa.String(length=32), nullable=False),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('slot_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('procurement_slots.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('produce_type', sa.String(length=50), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('quantity_unit', sa.String(length=20), nullable=False, server_default='quintal'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='BOOKED'),
        sa.Column('queue_number', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('quantity > 0', name='check_positive_quantity'),
    )
    op.create_index('ix_bookings_public_token', 'bookings', ['public_token'], unique=True)
    op.create_index('ix_bookings_farmer_id', 'bookings', ['farmer_id'])
    op.create_index('ix_bookings_slot_id', 'bookings', ['slot_id'])
    op.create_index('ix_bookings_status', 'bookings', ['status'])
    op.create_index('ix_bookings_produce_type', 'bookings', ['produce_type'])
    op.create_index('ix_bookings_slot_status', 'bookings', ['slot_id', 'status'])
    op.create_index('ix_bookings_farmer_status', 'bookings', ['farmer_id', 'status'])

    # 5. booking_status_history
    op.create_table(
        'booking_status_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('booking_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('old_status', sa.String(length=20), nullable=True),
        sa.Column('new_status', sa.String(length=20), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_booking_status_history_booking_id', 'booking_status_history', ['booking_id'])
    op.create_index('ix_booking_status_history_actor_id', 'booking_status_history', ['actor_id'])
    op.create_index('ix_history_booking_created', 'booking_status_history', ['booking_id', 'created_at'])


def downgrade() -> None:
    op.drop_table('booking_status_history')
    op.drop_table('bookings')
    op.drop_table('procurement_slots')
    op.drop_table('procurement_centres')
    op.drop_table('users')

