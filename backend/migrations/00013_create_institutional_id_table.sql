-- +goose Up
-- +goose StatementBegin
CREATE TABLE institutional_id (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id TEXT NOT NULL UNIQUE
);

INSERT INTO institutional_id (institution_id) VALUES ('2022c021');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
