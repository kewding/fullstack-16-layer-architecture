-- +goose Up
-- +goose StatementBegin

-- users.email currently has a hard UNIQUE constraint which blocks re-registration
-- when a soft-deleted users row (graduated/revoked vendor) still holds the email.
-- EmailExists already filters WHERE deleted_at IS NULL so the application-level
-- uniqueness check passes, but the DB constraint fires on INSERT regardless.
--
-- Fix: drop the hard constraint and replace with a partial unique index that
-- only enforces uniqueness for active (non-deleted) rows — the same pattern
-- used for vendors.email (migration__vendors_email_partial_unique.sql).

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

CREATE UNIQUE INDEX uq_users_email_active
    ON users (email)
    WHERE deleted_at IS NULL;

COMMENT ON INDEX uq_users_email_active IS
    'Enforces email uniqueness only for active (non-deleted) users. '
    'Allows soft-deleted vendor accounts to be re-used when a new invite is sent.';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS uq_users_email_active;

ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- +goose StatementEnd
