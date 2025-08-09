package utils

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"log"
	"net/smtp"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func GenerateToken() string {
	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		log.Fatal(err)
	}
	return base64.URLEncoding.EncodeToString(token)
}

func SendVerificationEmail(email string, db *sql.DB) {
	token := GenerateToken()

	_, err := db.Exec("UPDATE users SET verification_token = $1 WHERE email = $2", token, email)
	if err != nil {
		log.Printf("Error updating verification token: %v", err)
		return
	}

	mailPass := os.Getenv("GMAIL_PASS")
	auth := smtp.PlainAuth("", "louis.sylvestre26@gmail.com", mailPass, "smtp.gmail.com")
	err = smtp.SendMail("smtp.gmail.com:587", auth, "louis.sylvestre26@gmail.com", []string{email}, []byte("Subject: Matcha Email Verification\n\nPlease verify your email by clicking on the following link: http://localhost:8080/verify?token="+token))
	if err != nil {
		log.Printf("Error sending verification email: %v", err)
	}
}
