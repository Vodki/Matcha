package main

import (
	"database/sql"
	"matcha/utils"

	"github.com/gin-gonic/gin"
)

func registerHandler(c *gin.Context, db *sql.DB) {
	email := c.PostForm("email")
	password := c.PostForm("password")
	lastName := c.PostForm("last_name")
	firstName := c.PostForm("first_name")
	username := c.PostForm("username")

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

	c.JSON(200, gin.H{"message": "User registered successfully"})

}

func loginHandler(c *gin.Context, db *sql.DB) {
	// Handler logic for user login
}
