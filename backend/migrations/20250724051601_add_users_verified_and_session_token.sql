-- +goose Up
-- +goose StatementBegin
ALTER TABLE users
    ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN session_token TEXT;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users
    DROP COLUMN verified,
    DROP COLUMN session_token;
-- +goose StatementEnd
