-- +goose Up
-- +goose StatementBegin
CREATE TABLE users_rfid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- inst = institutional
    rfid_tag TEXT UNIQUE,

    --fk 
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated trigger
CREATE TRIGGER update_users_rfid_changetimestamp
BEFORE UPDATE ON users_rfid
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
