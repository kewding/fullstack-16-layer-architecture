-- +goose Up
-- +goose StatementBegin
ALTER TABLE medical_information
    ADD COLUMN biological_sex TEXT
        CHECK (biological_sex IN ('male', 'female'));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE medical_information
    DROP COLUMN IF EXISTS biological_sex;
-- +goose StatementEnd