-- +goose Up
-- +goose StatementBegin
CREATE TABLE stalls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    stall_name TEXT NOT NULL,

    --fk
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- deletion handling
    deleted_at TIMESTAMPTZ
);

-- updated trigger
CREATE TRIGGER update_stalls_changetimestamp
BEFORE UPDATE ON stalls
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
