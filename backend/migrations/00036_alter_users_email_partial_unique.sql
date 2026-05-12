-- +goose Up
-- +goose StatementBegin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

CREATE UNIQUE INDEX uq_users_email_active
    ON users (email)
    WHERE deleted_at IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS uq_users_email_active;

ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
-- +goose StatementEnd