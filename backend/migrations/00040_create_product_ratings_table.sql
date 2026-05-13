-- +goose Up
-- +goose StatementBegin

CREATE TABLE product_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- the product being rated
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- the customer who rated it (must have purchased)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- the sale that qualifies this rating (proof of purchase)
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

    -- 1.0–5.0 in 0.5 increments (e.g. 3.5, 4.0, 4.5)
    rating DECIMAL(2, 1) NOT NULL,

    -- optional written review
    review TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- one rating per user per product (can update their rating)
    CONSTRAINT uq_product_rating_user UNIQUE (product_id, user_id),

    -- enforce 1.0–5.0 in 0.5 steps
    CONSTRAINT chk_rating_range CHECK (rating >= 1.0 AND rating <= 5.0),
    CONSTRAINT chk_rating_half_step CHECK (MOD(rating * 2, 1) = 0)
);

CREATE INDEX idx_product_ratings_product_id ON product_ratings(product_id);
CREATE INDEX idx_product_ratings_user_id    ON product_ratings(user_id);
CREATE INDEX idx_product_ratings_sale_id    ON product_ratings(sale_id);

CREATE TRIGGER update_product_ratings_changetimestamp
BEFORE UPDATE ON product_ratings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE product_ratings IS
    'One row per user per product. '
    'sale_id enforces proof-of-purchase: the rating is only allowed if the user '
    'has a sales_items row linking to this product via that sale. '
    'Rating is 1.0–5.0 in 0.5 increments.';

COMMENT ON COLUMN product_ratings.rating IS
    'Decimal 1.0–5.0, half-step increments (1.0, 1.5, 2.0 … 5.0).';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS product_ratings;
-- +goose StatementEnd