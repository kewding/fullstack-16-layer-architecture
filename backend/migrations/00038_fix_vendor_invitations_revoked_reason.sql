-- +goose Up
-- +goose StatementBegin
ALTER TABLE vendor_invitations
    ALTER COLUMN revoked_reason TYPE JSONB
    USING CASE
        WHEN revoked_reason IS NULL THEN NULL
        ELSE to_jsonb(revoked_reason)
    END;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE vendor_invitations
    ALTER COLUMN revoked_reason TYPE TEXT[]
    USING CASE
        WHEN revoked_reason IS NULL THEN NULL
        ELSE ARRAY(SELECT jsonb_array_elements_text(revoked_reason))
    END;
-- +goose StatementEnd