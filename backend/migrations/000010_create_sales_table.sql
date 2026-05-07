-- +goose Up
-- +goose StatementBegin
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    --fk 
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE INDEX idx_sales_created_at_desc ON sales (created_at DESC);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
