package main

import (
	"database/sql"
	"matcha/utils"

	"github.com/gin-gonic/gin"
)

func registerHandler(c *gin.Context, db *sql.DB) {
	username := c.PostForm("username")
	password := c.PostForm("password")
	email := c.PostForm("email")
	lastName := c.PostForm("last_name")
	firstName := c.PostForm("first_name")

	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1 OR email = $2)", username, email).Scan(&exists)
	if err != nil {
		c.JSON(500, gin.H{"error": "Database error while checking user existence", "details": err.Error()})
		return
	}
	if exists {
		c.JSON(400, gin.H{"error": "Username or email already exists"})
		return
	}

	if len(password) < 8 {
		c.JSON(400, gin.H{"error": "Password must be at least 8 characters long"})
		return
	}
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		c.JSON(500, gin.H{"error": "Error hashing password"})
		return
	}

	_, err = db.Exec(
		`INSERT INTO users (email, password_hash, first_name, last_name, username) 
         VALUES ($1, $2, $3, $4, $5)`,
		email, hashedPassword, firstName, lastName, username,
	)
	if err != nil {
		c.JSON(500, gin.H{"error": "Error inserting user"})
		return
	}

	utils.SendVerificationEmail(email, db)

	c.JSON(200, gin.H{"message": "User registered successfully"})

}

func loginHandler(c *gin.Context, db *sql.DB) {
	username := c.PostForm("username")
	password := c.PostForm("password")

	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", username).Scan(&exists)
	if err != nil {
		c.JSON(500, gin.H{"error": "Database error while checking user existence", "details": err.Error()})
		return
	}
	if !exists {
		c.JSON(400, gin.H{"error": "Username does not exist"})
		return
	}

	var storedHashedPassword string
	err = db.QueryRow("SELECT password_hash FROM users WHERE username = $1", username).Scan(&storedHashedPassword)
	if err != nil {
		c.JSON(500, gin.H{"error": "Database error while retrieving user password", "details": err.Error()})
		return
	}

	if !utils.CheckPasswordHash(password, storedHashedPassword) {
		c.JSON(400, gin.H{"error": "Invalid password"})
		return
	}

	var isVerified bool
	err = db.QueryRow("SELECT verified FROM users WHERE username = $1", username).Scan(&isVerified)
	if err != nil {
		c.JSON(500, gin.H{"error": "Database error while checking verification status", "details": err.Error()})
		return
	}
	if !isVerified {
		c.JSON(403, gin.H{"error": "User account is not verified"})
		return
	}

	sessionToken := utils.GenerateToken()

	_, err = db.Exec("UPDATE users SET session_token = $1 WHERE username = $2", sessionToken, username)
	if err != nil {
		c.JSON(500, gin.H{"error": "Error updating session token", "details": err.Error()})
		return
	}

	c.SetCookie("session_token", sessionToken, 3600*24, "/", "", false, true)
	c.JSON(200, gin.H{"message": "Login successful"})
}

func verifyHandler(c *gin.Context, db *sql.DB) {
	token := c.Query("token")

	var email string
	err := db.QueryRow("SELECT email FROM users WHERE verification_token = $1", token).Scan(&email)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid or expired verification token"})
		return
	}

	_, err = db.Exec("UPDATE users SET verified = TRUE, verification_token = NULL WHERE email = $1", email)
	if err != nil {
		c.JSON(500, gin.H{"error": "Error updating user verification status", "details": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Email verified successfully"})
}