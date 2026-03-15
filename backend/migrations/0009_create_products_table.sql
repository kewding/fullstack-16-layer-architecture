-- +goose Up
-- +goose StatementBegin
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,

    product_name TEXT NOT NULL,
    image_url TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    quantity INTEGER NOT NULL
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
