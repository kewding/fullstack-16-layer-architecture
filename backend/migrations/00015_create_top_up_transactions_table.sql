-- +goose Up
-- +goose StatementBegin
CREATE TABLE top_up_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    --fk
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
)
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
