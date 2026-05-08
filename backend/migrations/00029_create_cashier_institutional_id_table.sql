-- +goose Up
-- +goose StatementBegin
CREATE TABLE cashier_institutional_id (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id TEXT NOT NULL UNIQUE
);

INSERT INTO cashier_institutional_id (cashier_id) VALUES ('cashier2026001');
INSERT INTO cashier_institutional_id (cashier_id) VALUES ('cashier2026002');

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS cashier_institutional_id;
-- +goose StatementEnd