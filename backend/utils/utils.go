package utils

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"log"
	"net/smtp"
	"os"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

var commonPasswords = map[string]bool{
	"password": true, "123456": true, "12345678": true, "qwerty": true,
	"abc123": true, "monkey": true, "1234567": true, "letmein": true,
	"trustno1": true, "dragon": true, "baseball": true, "iloveyou": true,
	"master": true, "sunshine": true, "ashley": true, "bailey": true,
	"passw0rd": true, "shadow": true, "123123": true, "654321": true,
	"superman": true, "qazwsx": true, "michael": true, "football": true,
	"password1": true, "password123": true, "welcome": true, "jesus": true,
	"ninja": true, "mustang": true, "password2": true, "amanda": true,
	"login": true, "admin": true, "princess": true, "solo": true,
	"flower": true, "hello": true, "charlie": true, "donald": true,
	"loveme": true, "zaq1zaq1": true, "freedom": true, "whatever": true,
	"qwertyuiop": true, "starwars": true, "computer": true, "jordan": true,
	"motdepasse": true, "azerty": true, "bonjour": true, "soleil": true,
	"amour": true, "chocolat": true, "coucou": true, "doudou": true,
	"chouchou": true, "marseille": true, "france": true, "jetaime": true,
	"nicolas": true, "camille": true, "thomas": true, "marine": true,
	"contraseña": true, "contrasena": true, "hola": true, "estrella": true,
	"amor": true, "barcelona": true, "madrid": true, "espana": true,
	"carlos": true, "garcia": true, "alejandro": true, "miguel": true,
	"passwort": true, "hallo": true, "schatz": true, "berlin": true,
	"qwertz": true, "liebe": true, "sommer": true, "ficken": true,
	"schmidt": true, "andrea": true, "stefan": true, "martin": true,
	"ciao": true, "amore": true, "juventus": true, "inter": true,
	"roma": true, "napoli": true, "francesco": true, "giuseppe": true,
	"senha": true, "brasil": true, "futebol": true, "flamengo": true,
	"gabriel": true, "lucas": true, "matheus": true, "felipe": true,
}

func ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("Password must be at least 8 characters long")
	}
	lowerPass := strings.ToLower(password)
	if commonPasswords[lowerPass] {
		return errors.New("This password is too common. Please choose a stronger password")
	}

	hasDigit := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)

	if !hasDigit {
		return errors.New("Password must contain at least one digit")
	}
	if !hasLower {
		return errors.New("Password must contain at least one lowercase letter")
	}
	if !hasUpper {
		return errors.New("Password must contain at least one uppercase letter")
	}

	return nil
}

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
	if mailPass == "" {
		log.Printf("GMAIL_PASS not set")
		return
	}

	fromEmail := "louis.sylvestre26@gmail.com"
	verifyLink := "http://localhost:8080/auth/verify?token=" + token

	subject := "Welcome to Matcha! Verify your email"

	htmlBody := `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fce7f3;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #a855f7 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🍵 Matcha</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Find your perfect match</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Welcome aboard! 👋</h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thanks for signing up for Matcha! We're excited to have you join our community.
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Please verify your email address by clicking the button below:
                            </p>
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="` + verifyLink + `" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #a855f7); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);">
                                            ✓ Verify my email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #9ca3af; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
                                Or copy this link: <a href="` + verifyLink + `" style="color: #ec4899;">` + verifyLink + `</a>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fdf2f8; padding: 20px 30px; text-align: center; border-radius: 0 0 16px 16px;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                If you didn't create an account on Matcha, you can safely ignore this email.
                            </p>
                            <p style="color: #d1d5db; font-size: 12px; margin: 10px 0 0 0;">
                                © 2026 Matcha. Made with ❤️
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

	message := []byte("MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" + htmlBody)

	auth := smtp.PlainAuth("", fromEmail, mailPass, "smtp.gmail.com")
	err = smtp.SendMail("smtp.gmail.com:587", auth, fromEmail, []string{email}, message)
	if err != nil {
		log.Printf("Error sending verification email: %v", err)
	} else {
		log.Printf("Verification email sent successfully to: %s", email)
	}
}

func SendPasswordResetEmail(email, token, username string) error {
	mailPass := os.Getenv("GMAIL_PASS")
	if mailPass == "" {
		log.Printf("GMAIL_PASS not set")
		return nil
	}

	fromEmail := "louis.sylvestre26@gmail.com"
	resetLink := "http://localhost:3000/reset-password?token=" + token

	subject := "Matcha - Password Reset Request"

	htmlBody := `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fce7f3;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #a855f7 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🍵 Matcha</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello ` + username + `! 🔐</h2>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                We received a request to reset your password. No worries, it happens to the best of us!
                            </p>
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Click the button below to create a new password:
                            </p>
                            <!-- Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="` + resetLink + `" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #a855f7); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);">
                                            🔑 Reset my password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #9ca3af; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
                                Or copy this link: <a href="` + resetLink + `" style="color: #ec4899;">` + resetLink + `</a>
                            </p>
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px; border-radius: 4px;">
                                <p style="color: #92400e; font-size: 14px; margin: 0;">
                                    ⏰ This link will expire in <strong>1 hour</strong>.
                                </p>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fdf2f8; padding: 20px 30px; text-align: center; border-radius: 0 0 16px 16px;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                If you didn't request a password reset, you can safely ignore this email.
                            </p>
                            <p style="color: #d1d5db; font-size: 12px; margin: 10px 0 0 0;">
                                © 2026 Matcha. Made with ❤️
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

	message := []byte("MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" + htmlBody)

	auth := smtp.PlainAuth("", fromEmail, mailPass, "smtp.gmail.com")
	err := smtp.SendMail("smtp.gmail.com:587", auth, fromEmail, []string{email}, message)
	if err != nil {
		log.Printf("Error sending password reset email: %v", err)
		return err
	}

	log.Printf("Password reset email sent successfully to: %s", email)
	return nil
}
