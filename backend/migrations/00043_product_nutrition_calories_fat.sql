-- +goose Up
-- +goose StatementBegin
ALTER TABLE product_nutrition
    ADD COLUMN calories_kcal DECIMAL(8, 3) NOT NULL DEFAULT 0,
    ADD COLUMN total_fat_g   DECIMAL(8, 3) NOT NULL DEFAULT 0;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE product_nutrition
    DROP COLUMN IF EXISTS calories_kcal,
    DROP COLUMN IF EXISTS total_fat_g;
-- +goose StatementEnd