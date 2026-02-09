-- +goose Up
-- +goose StatementBegin
CREATE TABLE user_roles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO user_roles (slug, display_name) VALUES 
('admin', 'Administrator'),
('student', 'Student');

-- trigger function for update_at
CREATE TRIGGER update_user_roles_changetimestamp
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query'; removed for absolute architectural safety, "forward only"
-- +goose StatementEnd
