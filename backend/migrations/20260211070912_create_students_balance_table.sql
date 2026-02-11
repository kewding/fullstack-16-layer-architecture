-- +goose Up
-- +goose StatementBegin
CREATE TABLE students_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    balance DECIMAL (12, 2) NOT NULL DEFAULT 0.00,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)

CREATE TRIGGER update_students_balance_changetimestamp
BEFORE UPDATE ON students_balance
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
