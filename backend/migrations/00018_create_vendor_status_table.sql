-- +goose Up
-- +goose StatementBegin
CREATE TYPE vendor_status AS ENUM ('invited', 'for_review', 'in_business');
-- CREATE TYPE concession_fee_type AS ENUM ('percentage', 'fixed');

CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT NOT NULL UNIQUE,

    owner_name TEXT NOT NULL,

    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    status vendor_status NOT NULL DEFAULT 'invited',

    -- concession_fee_type concession_fee_type,
    concession_fee_value DECIMAL(12, 2),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_active_vendors ON vendors(id) WHERE deleted_at IS NULL;

CREATE TRIGGER update_vendors_changetimestamp
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- DROP TABLE IF EXISTS vendors;
-- DROP TYPE IF EXISTS vendor_status;
-- DROP TYPE IF EXISTS concession_fee_type;
-- +goose StatementEnd