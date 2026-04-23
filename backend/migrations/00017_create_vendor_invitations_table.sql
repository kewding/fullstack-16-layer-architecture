-- +goose Up
-- +goose StatementBegin
CREATE TYPE invitation_status AS ENUM ('pending', 'used', 'expired');

CREATE TABLE vendor_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    token TEXT NOT NULL UNIQUE,

    email TEXT NOT NULL,
    owner_name TEXT NOT NULL, 

    status invitation_status NOT NULL DEFAULT 'pending',

    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_vendor_invitations_token ON vendor_invitations(token);
CREATE INDEX idx_vendor_invitations_email ON vendor_invitations(email);
CREATE INDEX idx_active_invitations ON vendor_invitations(id) WHERE deleted_at IS NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- DROP TABLE IF EXISTS vendor_invitations;
-- DROP TYPE IF EXISTS invitation_status;
-- +goose StatementEnd