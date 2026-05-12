-- +goose Up
-- +goose StatementBegin

-- 1. Add revoke reason fields to vendor_invitations
ALTER TABLE vendor_invitations
    ADD COLUMN IF NOT EXISTS revoked_reason      TEXT[]  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS revoked_other_reason TEXT   DEFAULT NULL;

-- 2. New notification types for former-vendor graduation
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'vendor_graduated';

-- 3. former_vendors — snapshot table, one row per graduated vendor
--    vendor_id references vendors(id) WITHOUT cascade so the vendors row stays after soft-delete.
CREATE TABLE former_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- reference back to the original vendor row (not cascaded — vendor row is kept)
    vendor_id   UUID NOT NULL REFERENCES vendors(id),

    -- who performed the graduation
    removed_by  UUID REFERENCES users(id) ON DELETE SET NULL,

    -- reason(s) selected by the admin
    --   pre-set values: "wrong_invite" | "terminated_contract" | "insufficient_credentials" | "others"
    --   "others" text is in other_reason
    reasons     JSONB NOT NULL DEFAULT '[]',

    -- snapshot of personal information at time of graduation
    personal_info_snapshot  JSONB NOT NULL DEFAULT '{}',

    -- snapshot of business information at time of graduation
    business_info_snapshot  JSONB NOT NULL DEFAULT '{}',

    -- ledger summary at time of graduation
    ledger_summary JSONB NOT NULL DEFAULT '{}',
    -- shape: {
    --   total_gross_profit:    number,
    --   total_concession_fees: number,
    --   total_remittances:     number,
    --   final_net_balance:     number,   -- must be 0.00 at graduation
    --   total_sales_count:     number
    -- }

    -- denormalized for fast list queries
    stall_name  TEXT NOT NULL DEFAULT '',
    owner_name  TEXT NOT NULL DEFAULT '',
    email       TEXT NOT NULL DEFAULT '',

    removed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_former_vendors_removed_at  ON former_vendors (removed_at DESC);
CREATE INDEX idx_former_vendors_email       ON former_vendors (email);
CREATE INDEX idx_former_vendors_stall_name  ON former_vendors (stall_name);
CREATE INDEX idx_former_vendors_vendor_id   ON former_vendors (vendor_id);

COMMENT ON TABLE former_vendors IS
    'Immutable snapshot of a vendor at the time they were graduated out of the system. '
    'The vendors row is soft-deleted (deleted_at set) but kept for referential integrity. '
    'The same email can be re-invited to create a fresh vendors row.';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS former_vendors;

ALTER TABLE vendor_invitations
    DROP COLUMN IF EXISTS revoked_reason,
    DROP COLUMN IF EXISTS revoked_other_reason;

-- NOTE: Removing enum values requires recreating the type — intentionally left as no-op.

-- +goose StatementEnd