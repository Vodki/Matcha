package main

import (
	"database/sql"
	"log"
	"matcha/utils"
	"strconv"
	"time"

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

// UpdateLocationHandler saves or updates user's geolocation
func UpdateLocationHandler(db *sql.DB) gin.HandlerFunc {
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

		var request struct {
			Latitude  float64  `json:"latitude" binding:"required"`
			Longitude float64  `json:"longitude" binding:"required"`
			Accuracy  *float64 `json:"accuracy"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request", "details": err.Error()})
			return
		}

		// Validate coordinates
		if request.Latitude < -90 || request.Latitude > 90 {
			c.JSON(400, gin.H{"error": "Latitude must be between -90 and 90"})
			return
		}
		if request.Longitude < -180 || request.Longitude > 180 {
			c.JSON(400, gin.H{"error": "Longitude must be between -180 and 180"})
			return
		}

		// Insert or update location
		query := `
			INSERT INTO user_locations (user_id, lat, lon, accuracy_m, updated_at) 
			VALUES ($1, $2, $3, $4, NOW())
			ON CONFLICT (user_id) 
			DO UPDATE SET lat = $2, lon = $3, accuracy_m = $4, updated_at = NOW()
		`
		_, err := db.Exec(query, userID, request.Latitude, request.Longitude, request.Accuracy)
		if err != nil {
			log.Printf("Error updating location: %v", err)
			c.JSON(500, gin.H{"error": "Error updating location", "details": err.Error()})
			return
		}

		c.JSON(200, gin.H{
			"message": "Location updated successfully",
			"location": gin.H{
				"latitude":  request.Latitude,
				"longitude": request.Longitude,
				"accuracy":  request.Accuracy,
			},
		})
	}
}

// GetUserLocationHandler retrieves a specific user's location
func GetUserLocationHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("userId")
		targetUserID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		var location struct {
			Latitude  float64  `json:"latitude"`
			Longitude float64  `json:"longitude"`
			Accuracy  *float64 `json:"accuracy"`
			UpdatedAt string   `json:"updated_at"`
		}

		err = db.QueryRow(
			"SELECT lat, lon, accuracy_m, updated_at FROM user_locations WHERE user_id = $1",
			targetUserID,
		).Scan(&location.Latitude, &location.Longitude, &location.Accuracy, &location.UpdatedAt)

		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{"error": "Location not found for this user"})
			return
		} else if err != nil {
			c.JSON(500, gin.H{"error": "Error fetching location", "details": err.Error()})
			return
		}

		c.JSON(200, gin.H{"location": location})
	}
}

// GetNearbyUsersHandler finds users near the authenticated user
func GetNearbyUsersHandler(db *sql.DB) gin.HandlerFunc {
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

		// Get current user's location
		var myLat, myLon float64
		err := db.QueryRow(
			"SELECT lat, lon FROM user_locations WHERE user_id = $1",
			userID,
		).Scan(&myLat, &myLon)

		if err == sql.ErrNoRows {
			c.JSON(400, gin.H{"error": "You need to set your location first"})
			return
		} else if err != nil {
			c.JSON(500, gin.H{"error": "Error fetching your location", "details": err.Error()})
			return
		}

		// Get radius parameter (default 200km)
		radiusKm := 200.0
		if radiusStr := c.Query("radius"); radiusStr != "" {
			if parsedRadius, err := strconv.ParseFloat(radiusStr, 64); err == nil && parsedRadius > 0 {
				radiusKm = parsedRadius
			}
		}

		// Get limit parameter (default 50)
		limit := 50
		if limitStr := c.Query("limit"); limitStr != "" {
			if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
				limit = parsedLimit
			}
		}

		// Call the nearby_users function
		rows, err := db.Query(
			"SELECT user_id, avatar_url, bio, lat, lon, accuracy_m, updated_at, distance_km FROM nearby_users($1, $2, $3, $4)",
			myLat, myLon, radiusKm, limit,
		)
		if err != nil {
			log.Printf("Error calling nearby_users: %v", err)
			c.JSON(500, gin.H{"error": "Error finding nearby users", "details": err.Error()})
			return
		}
		defer rows.Close()

		type NearbyUser struct {
			UserID     int      `json:"user_id"`
			AvatarURL  *string  `json:"avatar_url"`
			Bio        *string  `json:"bio"`
			Latitude   float64  `json:"latitude"`
			Longitude  float64  `json:"longitude"`
			Accuracy   *float64 `json:"accuracy"`
			UpdatedAt  string   `json:"updated_at"`
			DistanceKm float64  `json:"distance_km"`
		}

		var nearbyUsers []NearbyUser
		for rows.Next() {
			var user NearbyUser
			err := rows.Scan(
				&user.UserID,
				&user.AvatarURL,
				&user.Bio,
				&user.Latitude,
				&user.Longitude,
				&user.Accuracy,
				&user.UpdatedAt,
				&user.DistanceKm,
			)
			if err != nil {
				log.Printf("Error scanning nearby user: %v", err)
				continue
			}
			// Don't include the current user in results
			if user.UserID != userID {
				nearbyUsers = append(nearbyUsers, user)
			}
		}

		c.JSON(200, gin.H{
			"nearby_users": nearbyUsers,
			"count":        len(nearbyUsers),
			"radius_km":    radiusKm,
			"your_location": gin.H{
				"latitude":  myLat,
				"longitude": myLon,
			},
		})
	}
}

// RequestPasswordResetHandler sends a password reset email
func RequestPasswordResetHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		email := c.PostForm("email")

		if email == "" {
			c.JSON(400, gin.H{"error": "Email is required"})
			return
		}

		// Check if user exists
		var userID int
		var username string
		err := db.QueryRow("SELECT id, username FROM users WHERE email = $1", email).Scan(&userID, &username)
		if err == sql.ErrNoRows {
			// Don't reveal if email exists or not for security
			c.JSON(200, gin.H{"message": "If this email exists, a password reset link has been sent"})
			return
		} else if err != nil {
			log.Printf("Error checking user: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		// Generate reset token
		resetToken := utils.GenerateToken()
		expiresAt := time.Now().Add(1 * time.Hour)

		// Save token to database
		_, err = db.Exec(
			"UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3",
			resetToken, expiresAt, userID,
		)
		if err != nil {
			log.Printf("Error saving reset token: %v", err)
			c.JSON(500, gin.H{"error": "Error generating reset token"})
			return
		}

		// Send reset email
		err = utils.SendPasswordResetEmail(email, resetToken, username)
		if err != nil {
			log.Printf("Error sending reset email: %v", err)
			c.JSON(500, gin.H{"error": "Error sending reset email"})
			return
		}

		c.JSON(200, gin.H{"message": "If this email exists, a password reset link has been sent"})
	}
}

// ResetPasswordHandler resets the password using the token
func ResetPasswordHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.PostForm("token")
		newPassword := c.PostForm("password")

		if token == "" || newPassword == "" {
			c.JSON(400, gin.H{"error": "Token and new password are required"})
			return
		}

		if len(newPassword) < 8 {
			c.JSON(400, gin.H{"error": "Password must be at least 8 characters long"})
			return
		}

		// Check if token exists and is not expired
		var userID int
		var expiresAt time.Time
		err := db.QueryRow(
			"SELECT id, reset_token_expires_at FROM users WHERE reset_token = $1",
			token,
		).Scan(&userID, &expiresAt)

		if err == sql.ErrNoRows {
			c.JSON(400, gin.H{"error": "Invalid or expired reset token"})
			return
		} else if err != nil {
			log.Printf("Error checking reset token: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		// Check if token is expired
		if time.Now().After(expiresAt) {
			c.JSON(400, gin.H{"error": "Reset token has expired"})
			return
		}

		// Hash new password
		hashedPassword, err := utils.HashPassword(newPassword)
		if err != nil {
			c.JSON(500, gin.H{"error": "Error hashing password"})
			return
		}

		// Update password and clear reset token
		_, err = db.Exec(
			"UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2",
			hashedPassword, userID,
		)
		if err != nil {
			log.Printf("Error updating password: %v", err)
			c.JSON(500, gin.H{"error": "Error updating password"})
			return
		}

		c.JSON(200, gin.H{"message": "Password reset successfully"})
	}
}
