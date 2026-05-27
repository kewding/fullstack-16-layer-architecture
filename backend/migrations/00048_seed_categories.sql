-- +goose Up
-- +goose StatementBegin
INSERT INTO categories (id, name, description, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Meals',  'Balanced rice and protein bowls', now(), now()),
    (gen_random_uuid(), 'Snacks', 'Quick bites and sandwiches',      now(), now()),
    (gen_random_uuid(), 'Drinks', 'Refreshing cold beverages',       now(), now())
ON CONFLICT (name) DO NOTHING;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM categories WHERE name IN ('Meals', 'Snacks', 'Drinks');
-- +goose StatementEnd