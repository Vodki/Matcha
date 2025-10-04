-- +goose Up
-- +goose StatementBegin
-- Add password reset token columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Remove password reset token columns
DROP INDEX IF EXISTS idx_users_reset_token;
ALTER TABLE users 
DROP COLUMN IF EXISTS reset_token,
DROP COLUMN IF EXISTS reset_token_expires_at;
-- +goose StatementEnd
