-- +goose Up
-- +goose StatementBegin
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id_number TEXT NOT NULL UNIQUE,

    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,

    birth_date DATE NOT NULL,
    contact_no TEXT,

    -- for data utility/analytics
    -- this could add another table specifically for normalization
    -- department TEXT NOT NULL, 
    -- program TEXT NOT NULL,
    
    -- fk
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated trigger
CREATE TRIGGER update_students_changetimestamp
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
