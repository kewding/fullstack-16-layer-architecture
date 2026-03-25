-- +goose Up
-- +goose StatementBegin
CREATE TYPE vendor_status AS ENUM ('invited', 'for_review', 'in_business');

CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- populated at invite time
    email TEXT NOT NULL UNIQUE,

    -- populated after registration completes
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    status vendor_status NOT NULL DEFAULT 'invited',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_status ON vendors(status);

CREATE TRIGGER update_vendors_changetimestamp
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- DROP TABLE IF EXISTS vendors;
-- DROP TYPE IF EXISTS vendor_status;
-- +goose StatementEnd