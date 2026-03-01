-- +goose Up
-- +goose StatementBegin
CREATE TABLE sessions (
    -- The cryptographically secure hex string from security.GenerateRandomToken()
    token TEXT PRIMARY KEY, 
    
    -- Foreign key linking the session to the user [1]
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- The expiration timestamp calculated by the UseCase
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Standard audit columns used in your other tables [4, 6]
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups during session verification
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- SELECT 'down SQL query';
-- +goose StatementEnd
