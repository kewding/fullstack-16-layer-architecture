-- +goose Up
-- +goose StatementBegin
CREATE TABLE users_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,

    birth_date DATE NOT NULL,
    contact_no TEXT,
    
    -- fk
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated trigger
CREATE TRIGGER update_users_info_changetimestamp
BEFORE UPDATE ON users_info
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
