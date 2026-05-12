-- +goose Up
-- +goose StatementBegin

CREATE TYPE top_up_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE rejection_reason_type AS ENUM ('cancelled_upon_payment', 'wrong_request', 'other');

CREATE TABLE top_up_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- the customer who submitted the request
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    amount DECIMAL(12, 2) NOT NULL,

    status top_up_request_status NOT NULL DEFAULT 'pending',

    -- set when accepted or rejected
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- set when rejected
    rejection_reason rejection_reason_type,
    rejection_comment TEXT,

    -- snapshot captured at acceptance time
    balance_before DECIMAL(12, 2),
    balance_after  DECIMAL(12, 2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_top_up_requests_user_id         ON top_up_requests(user_id);
CREATE INDEX idx_top_up_requests_status          ON top_up_requests(status);
CREATE INDEX idx_top_up_requests_created_at_desc ON top_up_requests(created_at DESC);

CREATE TRIGGER update_top_up_requests_changetimestamp
BEFORE UPDATE ON top_up_requests
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS top_up_requests;
DROP TYPE IF EXISTS top_up_request_status;
DROP TYPE IF EXISTS rejection_reason_type;
-- +goose StatementEnd