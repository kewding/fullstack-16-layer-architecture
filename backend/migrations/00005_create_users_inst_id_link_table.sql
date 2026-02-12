-- +goose Up
-- +goose StatementBegin
CREATE TABLE users_inst_id (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- inst = institutional
    inst_id TEXT NOT NULL UNIQUE,

    --fk
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated trigger
CREATE TRIGGER update_users_inst_id_changetimestamp
BEFORE UPDATE ON users_inst_id
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
