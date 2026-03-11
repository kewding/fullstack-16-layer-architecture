-- +goose Up
-- +goose StatementBegin
CREATE TABLE institutional_id (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id TEXT NOT NULL UNIQUE
);

INSERT INTO institutional_id (institution_id) VALUES ('2022c021');
INSERT INTO institutional_id (institution_id) VALUES ('2022c073');
INSERT INTO institutional_id (institution_id) VALUES ('2022c081');
INSERT INTO institutional_id (institution_id) VALUES ('2022c011');
INSERT INTO institutional_id (institution_id) VALUES ('2022c022');
INSERT INTO institutional_id (institution_id) VALUES ('2022c013');
INSERT INTO institutional_id (institution_id) VALUES ('2022c020');
INSERT INTO institutional_id (institution_id) VALUES ('2022c001');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
