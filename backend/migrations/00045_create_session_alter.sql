-- +goose Up
-- +goose StatementBegin
ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS device_info TEXT,
    ADD COLUMN IF NOT EXISTS ip_address  TEXT,
    ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ NOT NULL DEFAULT now();
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar     TEXT,
    ADD COLUMN IF NOT EXISTS student_id TEXT,
    ADD COLUMN IF NOT EXISTS allergens  TEXT[] NOT NULL DEFAULT '{}';
-- +goose StatementEnd

-- +goose StatementBegin
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_student_id
    ON users(student_id) WHERE student_id IS NOT NULL;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TRIGGER update_categories_changetimestamp
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS ingredients  TEXT,
    ADD COLUMN IF NOT EXISTS rating       DECIMAL(3,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS total_calories INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_method TEXT,
    ADD COLUMN IF NOT EXISTS status         TEXT NOT NULL DEFAULT 'completed';
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS concession_fee_type TEXT
        CHECK (concession_fee_type IN ('percentage', 'fixed'));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE sessions
    DROP COLUMN IF EXISTS device_info,
    DROP COLUMN IF EXISTS ip_address,
    DROP COLUMN IF EXISTS is_active,
    DROP COLUMN IF EXISTS last_active;
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE users
    DROP COLUMN IF EXISTS avatar,
    DROP COLUMN IF EXISTS student_id,
    DROP COLUMN IF EXISTS allergens;
-- +goose StatementEnd

-- +goose StatementBegin
DROP INDEX IF EXISTS uq_users_student_id;
-- +goose StatementEnd

-- +goose StatementBegin
DROP TABLE IF EXISTS categories;
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE products
    DROP COLUMN IF EXISTS ingredients,
    DROP COLUMN IF EXISTS rating,
    DROP COLUMN IF EXISTS rating_count,
    DROP COLUMN IF EXISTS category_id,
    DROP COLUMN IF EXISTS deleted_at;
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE sales
    DROP COLUMN IF EXISTS total_calories,
    DROP COLUMN IF EXISTS payment_method,
    DROP COLUMN IF EXISTS status;
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE vendors
    DROP COLUMN IF EXISTS concession_fee_type;
-- +goose StatementEnd