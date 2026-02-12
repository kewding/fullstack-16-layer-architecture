-- +goose Up
-- +goose StatementBegin
CREATE TABLE customers_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    --fk
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    debit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    credit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,

    --
    reference_id UUID NOT NULL,
    reference_type transaction_type TYPE NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now() 
);

CREATE INDEX idx_ledger_user_date ON customers_ledger(user_id, created_at DESC);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
