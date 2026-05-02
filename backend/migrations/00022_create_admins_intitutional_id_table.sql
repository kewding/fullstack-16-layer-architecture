-- +goose Up
-- +goose StatementBegin
CREATE TABLE admins_institutional_id (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL UNIQUE
);

INSERT INTO admins_institutional_id (admin_id) VALUES ('admin2026001');
INSERT INTO admins_institutional_id (admin_id) VALUES ('admin2026002');
INSERT INTO admins_institutional_id (admin_id) VALUES ('admin2026003');
INSERT INTO admins_institutional_id (admin_id) VALUES ('admin2026004');
INSERT INTO admins_institutional_id (admin_id) VALUES ('admin2026005');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS admins_institutional_id;
-- +goose StatementEnd