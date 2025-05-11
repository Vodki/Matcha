package user

import (
	"context"
	"fmt"

	"github.com/jackc/pgx"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int
	Email        string
	Username     string
	PasswordHash string
	FirstName    string
	LastName     string
}

func CreateUser(ctx context.Context, conn *pgx.Conn, email, username, password, firstName, lastName string) (*User, error) {
	// 1. Hash the password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// 2. Insert user into DB (with first_name and last_name)
	var user User
	err = conn.QueryRowEx(ctx,
		`INSERT INTO users (email, username, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, username, password_hash, first_name, last_name`,
		nil, // options can be nil
		email, username, string(passwordHash), firstName, lastName,
	).Scan(&user.ID, &user.Email, &user.Username, &user.PasswordHash, &user.FirstName, &user.LastName)

	if err != nil {
		return nil, fmt.Errorf("failed to insert user: %w", err)
	}
	return &user, nil
}
