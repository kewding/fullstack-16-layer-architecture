-- +goose Up
-- +goose StatementBegin
ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER update_sales_changetimestamp
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TRIGGER IF EXISTS update_sales_changetimestamp ON sales;
ALTER TABLE sales DROP COLUMN IF EXISTS updated_at;
-- +goose StatementEnd
