-- +goose Up
-- +goose StatementBegin

-- ── 1. Fix vendors_ledger unique constraint ───────────────────────────────────
--
-- The old constraint prevented more than one gross_profit entry per vendor per
-- month (billing_month = NULL collapsed into a single NULLS NOT DISTINCT bucket).
-- With per-sale gross_profit entries billing_month is always NULL and reference_id
-- is the sale UUID, so we need a different strategy:
--
--   • gross_profit  → unique per (vendor_id, reference_id)   [one entry per sale]
--   • concession_fee → unique per (vendor_id, billing_month) [one entry per month]
--   • remittance    → no uniqueness constraint (multiple allowed)
--
-- Drop the old table-level constraint first, then add two partial unique indexes.

ALTER TABLE vendors_ledger
    DROP CONSTRAINT IF EXISTS uq_ledger_vendor_month_type;

-- One gross_profit entry per sale (reference_id = sales.id)
CREATE UNIQUE INDEX uq_ledger_vendor_sale_gross
    ON vendors_ledger (vendor_id, reference_id)
    WHERE entry_type = 'gross_profit' AND reference_id IS NOT NULL;

-- One concession_fee entry per vendor per billing month
CREATE UNIQUE INDEX uq_ledger_vendor_month_fee
    ON vendors_ledger (vendor_id, billing_month)
    WHERE entry_type = 'concession_fee' AND billing_month IS NOT NULL;

-- ── 2. Create vendor_withdrawal_requests table ────────────────────────────────

-- Extend user_notification_type for vendor withdrawal events
ALTER TYPE user_notification_type ADD VALUE IF NOT EXISTS 'vendor_withdrawal_accepted';
ALTER TYPE user_notification_type ADD VALUE IF NOT EXISTS 'vendor_withdrawal_rejected';

-- Vendor withdrawal status enum
CREATE TYPE vendor_withdrawal_status AS ENUM ('pending', 'completed', 'rejected');

CREATE TABLE vendor_withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- the vendor's user_id (from users table, role_id = 3)
    user_id   UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,

    -- vendor FK for quick joins to vendors / vendors_ledger
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

    amount DECIMAL(12, 2) NOT NULL,

    status vendor_withdrawal_status NOT NULL DEFAULT 'pending',

    -- cashier who processed the request
    cashier_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    cashier_name TEXT,  -- denormalised snapshot so history survives cashier deletion

    -- rejection details (NULL when completed)
    rejection_reason  rejection_reason_type,
    rejection_comment TEXT,

    -- wallet snapshot captured at completion time (NULL for pending / rejected)
    balance_before DECIMAL(12, 2),
    balance_after  DECIMAL(12, 2),

    -- vendors_ledger entry posted on completion (NULL until completed)
    ledger_entry_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_wr_user_id    ON vendor_withdrawal_requests(user_id);
CREATE INDEX idx_vendor_wr_vendor_id  ON vendor_withdrawal_requests(vendor_id);
CREATE INDEX idx_vendor_wr_status     ON vendor_withdrawal_requests(status);
CREATE INDEX idx_vendor_wr_created_at ON vendor_withdrawal_requests(created_at DESC);

CREATE TRIGGER update_vendor_withdrawal_requests_changetimestamp
BEFORE UPDATE ON vendor_withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE vendor_withdrawal_requests IS
    'Vendor remittance/withdrawal requests processed by the cashier. '
    'On completion a remittance debit entry is posted to vendors_ledger '
    'and the vendor wallet is debited atomically.';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS vendor_withdrawal_requests;
DROP TYPE  IF EXISTS vendor_withdrawal_status;

DROP INDEX IF EXISTS uq_ledger_vendor_sale_gross;
DROP INDEX IF EXISTS uq_ledger_vendor_month_fee;

-- Restore the original table-level constraint (Postgres 15+ NULLS NOT DISTINCT)
ALTER TABLE vendors_ledger
    ADD CONSTRAINT uq_ledger_vendor_month_type
        UNIQUE NULLS NOT DISTINCT (vendor_id, billing_month, entry_type);

-- +goose StatementEnd