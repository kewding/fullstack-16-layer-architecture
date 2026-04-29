-- +goose Up
-- +goose StatementBegin
CREATE TABLE vendor_business_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- fk
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- business registration
    dti_sec_number TEXT,
    tin TEXT,

    -- document URLs from Google Drive
    proof_of_business_address_url TEXT,
    barangay_clearance_url TEXT,
    mayors_permit_url TEXT,

    -- verification flags — set by admin
    is_dti_verified BOOLEAN NOT NULL DEFAULT false,
    is_tin_verified BOOLEAN NOT NULL DEFAULT false,
    is_documents_verified BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_vendor_business_info_changetimestamp
BEFORE UPDATE ON vendor_business_info
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS vendor_business_info;
-- +goose StatementEnd