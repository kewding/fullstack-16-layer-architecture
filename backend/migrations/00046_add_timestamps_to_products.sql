-- +goose Up
-- +goose StatementBegin
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER update_products_changetimestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TRIGGER IF EXISTS update_products_changetimestamp ON products;
ALTER TABLE products
    DROP COLUMN IF EXISTS created_at,
    DROP COLUMN IF EXISTS updated_at;
-- +goose StatementEnd