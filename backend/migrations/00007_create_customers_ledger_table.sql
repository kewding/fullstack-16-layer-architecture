-- +goose Up
-- +goose StatementBegin
CREATE TABLE customers_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    --fk
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    amount DECIMAL (12, 2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now() 
)

CREATE TRIGGER update_customers_ledger_changetimestamp
BEFORE UPDATE ON customers_ledger
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
