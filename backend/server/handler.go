package main

import (
	"database/sql"
	"matcha/utils"

	"github.com/gin-gonic/gin"
)

func RegisterHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
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

}

func LoginHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
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
}

func VerifyHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
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
}

func LogoutHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionToken, err := c.Cookie("session_token")
		if err != nil {
			c.JSON(400, gin.H{"error": "Not logged in"})
			return
		}

		_, err = db.Exec("UPDATE users SET session_token = NULL WHERE session_token = $1", sessionToken)
		if err != nil {
			c.JSON(500, gin.H{"error": "Error logging out", "details": err.Error()})
			return
		}

		c.SetCookie("session_token", "", -1, "/", "", false, true)
		c.JSON(200, gin.H{"message": "Logout successful"})
	}
}

func PostTagHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get userID from context (set by AuthMiddleware)
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		userID, ok := userIDVal.(int)
		if !ok {
			c.JSON(500, gin.H{"error": "Invalid user ID"})
			return
		}

		// Get tag name from URL params
		tagName := c.Query("tag")
		if tagName == "" {
			c.JSON(400, gin.H{"error": "Tag name is required"})
			return
		}

		// Insert tag if it doesn't exist, get tag ID
		var tagID int
		err := db.QueryRow("SELECT id FROM tags WHERE name = $1", tagName).Scan(&tagID)
		if err == sql.ErrNoRows {
			err = db.QueryRow("INSERT INTO tags (name) VALUES ($1) RETURNING id", tagName).Scan(&tagID)
			if err != nil {
				c.JSON(500, gin.H{"error": "Error creating tag", "details": err.Error()})
				return
			}
		} else if err != nil {
			c.JSON(500, gin.H{"error": "Database error", "details": err.Error()})
			return
		}

		// Assign tag to user if not already assigned
		_, err = db.Exec(
			"INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
			userID, tagID,
		)
		if err != nil {
			c.JSON(500, gin.H{"error": "Error assigning tag to user", "details": err.Error()})
			return
		}

		c.JSON(200, gin.H{"message": "Tag created and assigned successfully"})
	}
}

func GetUserTagsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		userID, ok := userIDVal.(int)
		if !ok {
			c.JSON(500, gin.H{"error": "Invalid user ID"})
			return
		}

		rows, err := db.Query("SELECT t.id, t.name FROM tags t JOIN user_tags ut ON t.id = ut.tag_id WHERE ut.user_id = $1", userID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Error fetching user tags", "details": err.Error()})
			return
		}
		defer rows.Close()

		var tags []struct {
			ID   int    `json:"id"`
			Name string `json:"name"`
		}

		for rows.Next() {
			var tag struct {
				ID   int    `json:"id"`
				Name string `json:"name"`
			}
			if err := rows.Scan(&tag.ID, &tag.Name); err != nil {
				c.JSON(500, gin.H{"error": "Error scanning user tag", "details": err.Error()})
				return
			}
			tags = append(tags, tag)
		}

		c.JSON(200, gin.H{"tags": tags})
	}
}

func DeleteTagHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		userID, ok := userIDVal.(int)
		if !ok {
			c.JSON(500, gin.H{"error": "Invalid user ID"})
			return
		}

		tagName := c.Query("tag")
		if tagName == "" {
			c.JSON(400, gin.H{"error": "Tag name is required"})
			return
		}

		// Get tag ID from tag name
		var tagID int
		err := db.QueryRow("SELECT id FROM tags WHERE name = $1", tagName).Scan(&tagID)
		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{"error": "Tag not found"})
			return
		} else if err != nil {
			c.JSON(500, gin.H{"error": "Database error while fetching tag", "details": err.Error()})
			return
		}

		// Check if the tag is associated with the user
		var existsForUser bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM user_tags WHERE user_id = $1 AND tag_id = $2)", userID, tagID).Scan(&existsForUser)
		if err != nil {
			c.JSON(500, gin.H{"error": "Database error while checking user tag existence", "details": err.Error()})
			return
		}
		if !existsForUser {
			c.JSON(404, gin.H{"error": "Tag not found for user"})
			return
		}

		// Delete the user-tag association
		_, err = db.Exec("DELETE FROM user_tags WHERE user_id = $1 AND tag_id = $2", userID, tagID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Error deleting user tag association", "details": err.Error()})
			return
		}

		c.JSON(200, gin.H{"message": "User tag deleted successfully"})
	}
}
