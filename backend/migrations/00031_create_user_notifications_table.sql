-- +goose Up
-- +goose StatementBegin

CREATE TYPE user_notification_type AS ENUM ('topup_accepted', 'topup_rejected', 'purchase');

CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type user_notification_type NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,

    is_read BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_notifications_user_id    ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read    ON user_notifications(user_id, is_read);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_notifications;
DROP TYPE IF EXISTS user_notification_type;
-- +goose StatementEnd