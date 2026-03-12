-- +goose Up
-- +goose StatementBegin
CREATE TABLE sales_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    --fk
    sales_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

    products_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    quantity INTEGER NOT NULL,

    extended_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,

)
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
