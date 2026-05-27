-- +goose Up
-- +goose StatementBegin
ALTER TABLE sales_items
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE sales_items DROP COLUMN IF EXISTS created_at;
-- +goose StatementEnd