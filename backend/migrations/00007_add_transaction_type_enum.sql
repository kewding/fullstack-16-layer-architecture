-- +goose Up
-- +goose StatementBegin
CREATE TYPE transaction_type AS ENUM ('sale', 'top-up', 'refund', 'purchase');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
