-- +goose Up
-- +goose StatementBegin
CREATE TABLE allergen_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- who was blocked
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- what they tried to buy
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- which stall
    stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,

    -- the specific allergen that triggered the block
    -- (one row per blocked attempt; if multiple allergens match, insert multiple rows)
    allergen_matched TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_allergen_interventions_created_at ON allergen_interventions(created_at DESC);
CREATE INDEX idx_allergen_interventions_user_id    ON allergen_interventions(user_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- forward-only, no-op
-- +goose StatementEnd