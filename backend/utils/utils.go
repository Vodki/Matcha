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
	err = smtp.SendMail("smtp.gmail.com:587", auth, "louis.sylvestre26@gmail.com", []string{email}, []byte("Subject: Matcha Email Verification\n\nPlease verify your email by clicking on the following link: http://localhost:8080/auth/verify?token="+token))
	if err != nil {
		log.Printf("Error sending verification email: %v", err)
	}
}

// SendPasswordResetEmail sends a password reset email with a token
func SendPasswordResetEmail(email, token, username string) error {
	mailPass := os.Getenv("GMAIL_PASS")
	if mailPass == "" {
		log.Printf("GMAIL_PASS not set")
		return nil // Don't fail if email is not configured
	}

	fromEmail := "louis.sylvestre26@gmail.com"
	resetLink := "http://localhost:3000/reset-password?token=" + token

	subject := "Matcha - Password Reset Request"
	body := "Hello " + username + ",\n\n" +
		"You have requested to reset your password on Matcha.\n\n" +
		"Click the link below to reset your password:\n" +
		resetLink + "\n\n" +
		"This link will expire in 1 hour.\n\n" +
		"If you did not request this, please ignore this email.\n\n" +
		"Best regards,\nThe Matcha Team"

	message := []byte("Subject: " + subject + "\n\n" + body)

	auth := smtp.PlainAuth("", fromEmail, mailPass, "smtp.gmail.com")
	err := smtp.SendMail("smtp.gmail.com:587", auth, fromEmail, []string{email}, message)
	if err != nil {
		log.Printf("Error sending password reset email: %v", err)
		return err
	}

	log.Printf("Password reset email sent successfully to: %s", email)
	return nil
}
