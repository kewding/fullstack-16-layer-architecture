-- +goose Up
-- +goose StatementBegin

-- Extend user_notification_type for vendor withdrawal events
ALTER TYPE user_notification_type ADD VALUE IF NOT EXISTS 'vendor_withdrawal_accepted';
ALTER TYPE user_notification_type ADD VALUE IF NOT EXISTS 'vendor_withdrawal_rejected';

-- Vendor withdrawal status enum
CREATE TYPE vendor_withdrawal_status AS ENUM ('pending', 'completed', 'rejected');

CREATE TABLE vendor_withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- the vendor's user_id (from users table, role_id = 3)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- vendor FK for quick joins to vendors / vendors_ledger
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

    amount DECIMAL(12, 2) NOT NULL,

    status vendor_withdrawal_status NOT NULL DEFAULT 'pending',

    -- cashier who processed the request
    cashier_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    cashier_name TEXT,  -- denormalised snapshot

    -- rejection details
    rejection_reason  rejection_reason_type,
    rejection_comment TEXT,

    -- wallet snapshot at completion time
    balance_before DECIMAL(12, 2),
    balance_after  DECIMAL(12, 2),

    -- vendors_ledger entry that was posted on completion (NULL until completed)
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
-- +goose StatementEnd