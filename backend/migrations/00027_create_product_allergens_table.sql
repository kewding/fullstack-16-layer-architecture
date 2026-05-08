-- +goose Up
-- +goose StatementBegin
CREATE TABLE product_allergens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- fk
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    allergen TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (product_id, allergen)
);

CREATE INDEX idx_product_allergens_product_id ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen    ON product_allergens(allergen);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- forward-only, no-op
-- +goose StatementEnd