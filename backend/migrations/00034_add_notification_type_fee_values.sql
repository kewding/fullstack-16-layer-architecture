-- +goose Up
-- +goose StatementBegin

-- Extend the notification_type enum with fee-related and system types.
-- ALTER TYPE ... ADD VALUE is non-transactional in Postgres — each must be a separate statement
-- and cannot be run inside a transaction block. Goose handles this correctly.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fee_reminder';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fee_reminder_7day';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fee_reminder_3day';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fee_edit_open';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fee_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'system_alert';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'system_info';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'customer_disabled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'customer_reactivated';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- NOTE: Postgres does not support removing values from an ENUM without recreating it.
-- To roll back cleanly you would need to recreate the type and all columns that depend on it.
-- For safety, the down migration is intentionally left as a no-op.
-- Handle rollback manually if required.

-- +goose StatementEnd