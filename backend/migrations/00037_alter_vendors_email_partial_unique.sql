-- +goose Up
-- +goose StatementBegin
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_email_key;

CREATE UNIQUE INDEX uq_vendors_email_active
    ON vendors (email)
    WHERE deleted_at IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS uq_vendors_email_active;

ALTER TABLE vendors ADD CONSTRAINT vendors_email_key UNIQUE (email);
-- +goose StatementEnd