-- +goose Up
-- +goose StatementBegin

-- Extend user_notification_type to include withdrawal events
ALTER TYPE user_notification_type ADD VALUE IF NOT EXISTS 'withdrawal_accepted';
ALTER TYPE user_notification_type ADD VALUE IF NOT EXISTS 'withdrawal_rejected';

-- Withdrawal request status enum
CREATE TYPE withdrawal_status AS ENUM ('pending', 'completed', 'rejected');

-- Shared rejection reason enum (reused by both top-up and withdrawal).
-- Only create if it does not already exist (top_up_requests may already use it).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rejection_reason_type') THEN
        CREATE TYPE rejection_reason_type AS ENUM (
            'suspected_fraud',
            'user_cancelled',
            'other'
        );
    END IF;
END$$;

CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- the customer making the request
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    amount DECIMAL(12, 2) NOT NULL,

    status withdrawal_status NOT NULL DEFAULT 'pending',

    -- cashier who processed the request (NULL until actioned)
    cashier_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    cashier_name TEXT,  -- denormalised snapshot so history survives cashier deletion

    -- rejection details (NULL when completed)
    rejection_reason  rejection_reason_type,
    rejection_comment TEXT,

    -- wallet snapshot captured at acceptance time (NULL for pending / rejected)
    balance_before DECIMAL(12, 2),
    balance_after  DECIMAL(12, 2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_withdrawal_requests_user_id    ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status     ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

CREATE TRIGGER update_withdrawal_requests_changetimestamp
BEFORE UPDATE ON withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS withdrawal_requests;
DROP TYPE  IF EXISTS withdrawal_status;
-- forward-only: do not drop rejection_reason_type or alter user_notification_type
-- +goose StatementEnd