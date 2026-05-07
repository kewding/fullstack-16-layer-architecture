-- +goose Up
-- +goose StatementBegin
CREATE TABLE product_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- fk
    product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,

    -- encouraged nutrients (NRF 9.3 positive side)
    protein_g        DECIMAL(8, 3) NOT NULL DEFAULT 0,
    fiber_g          DECIMAL(8, 3) NOT NULL DEFAULT 0,
    vitamin_a_mcg    DECIMAL(8, 3) NOT NULL DEFAULT 0,
    vitamin_c_mg     DECIMAL(8, 3) NOT NULL DEFAULT 0,
    vitamin_e_mg     DECIMAL(8, 3) NOT NULL DEFAULT 0,
    magnesium_mg     DECIMAL(8, 3) NOT NULL DEFAULT 0,
    potassium_mg     DECIMAL(8, 3) NOT NULL DEFAULT 0,
    iron_mg          DECIMAL(8, 3) NOT NULL DEFAULT 0,
    calcium_mg       DECIMAL(8, 3) NOT NULL DEFAULT 0,

    -- limited nutrients (NRF 9.3 negative side)
    sugar_g          DECIMAL(8, 3) NOT NULL DEFAULT 0,
    sodium_mg        DECIMAL(8, 3) NOT NULL DEFAULT 0,
    saturated_fat_g  DECIMAL(8, 3) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_product_nutrition_changetimestamp
BEFORE UPDATE ON product_nutrition
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- forward-only, no-op
-- +goose StatementEnd