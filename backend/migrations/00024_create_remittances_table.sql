-- +goose Up
-- +goose StatementBegin
CREATE TYPE remittance_status AS ENUM ('pending', 'completed');

CREATE TABLE remittances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- fk: the vendor requesting remittance
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status remittance_status NOT NULL DEFAULT 'pending',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_remittances_created_at_desc ON remittances (created_at DESC);

CREATE TRIGGER update_remittances_changetimestamp
BEFORE UPDATE ON remittances
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS remittances;
DROP TYPE IF EXISTS remittance_status;
-- +goose StatementEnd