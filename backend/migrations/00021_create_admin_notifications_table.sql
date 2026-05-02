-- +goose Up
-- +goose StatementBegin
CREATE TYPE notification_type AS ENUM ('vendor_approved', 'vendor_revoked', 'vendor_registered');

CREATE TABLE admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS admin_notifications;
DROP TYPE IF EXISTS notification_type;
-- +goose StatementEnd