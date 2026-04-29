-- +goose Up
-- +goose StatementBegin
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

CREATE TABLE medical_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- fk
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- vitals
    blood_type blood_type,
    height_cm  DECIMAL(5, 2),
    weight_kg  DECIMAL(5, 2),

    -- allergens
    allergens        TEXT[] NOT NULL DEFAULT '{}',
    custom_allergens TEXT[] NOT NULL DEFAULT '{}',

    -- medical conditions
    medical_conditions TEXT[] NOT NULL DEFAULT '{}',

    -- medications
    medications TEXT[] NOT NULL DEFAULT '{}',

    -- emergency contact
    emergency_contact_name         TEXT,
    emergency_contact_number       TEXT,
    emergency_contact_relationship TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_medical_information_changetimestamp
BEFORE UPDATE ON medical_information
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS medical_information;
DROP TYPE IF EXISTS blood_type;
-- +goose StatementEnd