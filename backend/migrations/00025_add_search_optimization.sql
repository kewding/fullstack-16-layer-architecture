-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on stall_name to support ILIKE '%name%'
CREATE INDEX IF NOT EXISTS idx_stalls_name_trgm ON stalls USING gin (stall_name gin_trgm_ops);
-- +goose StatementEnd

-- +goose Down
DROP INDEX IF EXISTS idx_stalls_name_trgm;