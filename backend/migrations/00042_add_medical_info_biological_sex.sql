-- +goose Up
-- +goose StatementBegin
ALTER TABLE medical_information
    ADD COLUMN biological_sex TEXT
        CHECK (biological_sex IN ('male', 'female'));

ALTER TYPE rejection_reason_type ADD VALUE IF NOT EXISTS 'suspected_fraud';
ALTER TYPE rejection_reason_type ADD VALUE IF NOT EXISTS 'user_cancelled';
 
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE medical_information
    DROP COLUMN IF EXISTS biological_sex;
-- +goose StatementEnd