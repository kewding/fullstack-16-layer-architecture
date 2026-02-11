-- +goose Up
-- +goose StatementBegin
CREATE TABLE students_rfid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    rfid_tag TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)

CREATE TRIGGER update_students_rfid_changetimestamp
BEFORE UPDATE ON students_rfid
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
