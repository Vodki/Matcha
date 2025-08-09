-- +goose Up
-- +goose StatementBegin
ALTER TABLE users
    ADD COLUMN verification_token TEXT,
    ADD COLUMN verification_sent_at TIMESTAMP;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users
    DROP COLUMN verification_token,
    DROP COLUMN verification_sent_at;
-- +goose StatementEnd
