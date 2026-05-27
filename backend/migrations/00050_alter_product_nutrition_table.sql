-- +goose Up
-- +goose StatementBegin
ALTER TABLE product_nutrition
    ALTER COLUMN protein_g TYPE DECIMAL(65, 3),
    ALTER COLUMN fiber_g TYPE DECIMAL(65, 3),
    ALTER COLUMN vitamin_a_mcg TYPE DECIMAL(65, 3),
    ALTER COLUMN vitamin_c_mg TYPE DECIMAL(65, 3),
    ALTER COLUMN vitamin_e_mg TYPE DECIMAL(65, 3),
    ALTER COLUMN magnesium_mg TYPE DECIMAL(65, 3),
    ALTER COLUMN potassium_mg TYPE DECIMAL(65, 3),
    ALTER COLUMN iron_mg TYPE DECIMAL(65, 3),
    ALTER COLUMN calcium_mg TYPE DECIMAL(65, 3),
    ALTER COLUMN sugar_g TYPE DECIMAL(65, 3),
    ALTER COLUMN sodium_mg TYPE DECIMAL(65, 3),
    ALTER COLUMN saturated_fat_g TYPE DECIMAL(65, 3);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE product_nutrition
    ALTER COLUMN protein_g TYPE DECIMAL(8, 3),
    ALTER COLUMN fiber_g TYPE DECIMAL(8, 3),
    ALTER COLUMN vitamin_a_mcg TYPE DECIMAL(8, 3),
    ALTER COLUMN vitamin_c_mg TYPE DECIMAL(8, 3),
    ALTER COLUMN vitamin_e_mg TYPE DECIMAL(8, 3),
    ALTER COLUMN magnesium_mg TYPE DECIMAL(8, 3),
    ALTER COLUMN potassium_mg TYPE DECIMAL(8, 3),
    ALTER COLUMN iron_mg TYPE DECIMAL(8, 3),
    ALTER COLUMN calcium_mg TYPE DECIMAL(8, 3),
    ALTER COLUMN sugar_g TYPE DECIMAL(8, 3),
    ALTER COLUMN sodium_mg TYPE DECIMAL(8, 3),
    ALTER COLUMN saturated_fat_g TYPE DECIMAL(8, 3);
-- +goose StatementEnd
