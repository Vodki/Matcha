package main

import (
	"database/sql"
	"fmt"
	"log"
	"matcha/utils"
	"strconv"
	"strings"
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

		// Validate password requirements
		if err := utils.ValidatePassword(password); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
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

		// Validate password requirements
		if err := utils.ValidatePassword(newPassword); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
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

// RecordProfileViewHandler enregistre qu'un utilisateur a vu un profil
func RecordProfileViewHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionToken := c.GetHeader("X-Session-Token")
		if sessionToken == "" {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		var viewerID int
		err := db.QueryRow("SELECT id FROM users WHERE session_token = $1", sessionToken).Scan(&viewerID)
		if err != nil {
			c.JSON(401, gin.H{"error": "Invalid session"})
			return
		}

		viewedIDStr := c.Param("userId")
		viewedID, err := strconv.Atoi(viewedIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		// Ne pas enregistrer si on regarde son propre profil
		if viewerID == viewedID {
			c.JSON(200, gin.H{"message": "Cannot view own profile"})
			return
		}

		// INSERT ... ON CONFLICT DO NOTHING pour éviter les doublons
		_, err = db.Exec(
			`INSERT INTO profile_views (viewer_id, viewed_id) 
			VALUES ($1, $2) 
			ON CONFLICT (viewer_id, viewed_id) DO NOTHING`,
			viewerID, viewedID,
		)
		if err != nil {
			log.Printf("Error recording profile view: %v", err)
			c.JSON(500, gin.H{"error": "Error recording view"})
			return
		}

		c.JSON(200, gin.H{"message": "View recorded successfully"})
	}
}

// ToggleProfileLikeHandler ajoute ou retire un like sur un profil
func ToggleProfileLikeHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Récupérer l'ID de l'utilisateur connecté depuis le contexte (middleware)
		likerIDVal, userExists := c.Get("userID")
		if !userExists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		likerID, ok := likerIDVal.(int)
		if !ok {
			c.JSON(500, gin.H{"error": "Invalid user ID"})
			return
		}

		likedIDStr := c.Param("userId")
		likedID, err := strconv.Atoi(likedIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		// Ne pas se liker soi-même
		if likerID == likedID {
			c.JSON(400, gin.H{"error": "Cannot like own profile"})
			return
		}

		// Vérifier si le like existe déjà
		var likeExists bool
		err = db.QueryRow(
			"SELECT EXISTS(SELECT 1 FROM profile_likes WHERE liker_id = $1 AND liked_id = $2)",
			likerID, likedID,
		).Scan(&likeExists)
		if err != nil {
			log.Printf("Error checking like existence: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		if likeExists {
			// Unlike - retirer le like
			_, err = db.Exec(
				"DELETE FROM profile_likes WHERE liker_id = $1 AND liked_id = $2",
				likerID, likedID,
			)
			if err != nil {
				log.Printf("Error removing like: %v", err)
				c.JSON(500, gin.H{"error": "Error removing like"})
				return
			}
			c.JSON(200, gin.H{"message": "Like removed", "liked": false})
		} else {
			// Like - ajouter le like
			_, err = db.Exec(
				"INSERT INTO profile_likes (liker_id, liked_id) VALUES ($1, $2)",
				likerID, likedID,
			)
			if err != nil {
				log.Printf("Error adding like: %v", err)
				c.JSON(500, gin.H{"error": "Error adding like"})
				return
			}
			c.JSON(200, gin.H{"message": "Like added", "liked": true})
		}
	}
}

// GetProfileStatsHandler retourne les statistiques d'un profil (vues, likes, fame rating)
func GetProfileStatsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("userId")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		var viewsCount, likesCount int
		var fameRating float64

		// Compter les vues
		err = db.QueryRow("SELECT COUNT(*) FROM profile_views WHERE viewed_id = $1", userID).Scan(&viewsCount)
		if err != nil {
			log.Printf("Error counting views: %v", err)
			viewsCount = 0
		}

		// Compter les likes
		err = db.QueryRow("SELECT COUNT(*) FROM profile_likes WHERE liked_id = $1", userID).Scan(&likesCount)
		if err != nil {
			log.Printf("Error counting likes: %v", err)
			likesCount = 0
		}

		// Récupérer le fame rating
		err = db.QueryRow("SELECT COALESCE(fame_rating, 0) FROM users WHERE id = $1", userID).Scan(&fameRating)
		if err != nil {
			log.Printf("Error getting fame rating: %v", err)
			fameRating = 0
		}

		c.JSON(200, gin.H{
			"views":       viewsCount,
			"likes":       likesCount,
			"fame_rating": fameRating,
		})
	}
}

// CheckLikeStatusHandler vérifie si l'utilisateur actuel a liké un profil
func CheckLikeStatusHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Récupérer l'ID de l'utilisateur connecté depuis le contexte (middleware)
		userIDVal, userExists := c.Get("userID")
		if !userExists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		likerID, ok := userIDVal.(int)
		if !ok {
			c.JSON(500, gin.H{"error": "Invalid user ID"})
			return
		}

		likedIDStr := c.Param("userId")
		likedID, err := strconv.Atoi(likedIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		var liked bool
		err = db.QueryRow(
			"SELECT EXISTS(SELECT 1 FROM profile_likes WHERE liker_id = $1 AND liked_id = $2)",
			likerID, likedID,
		).Scan(&liked)
		if err != nil {
			log.Printf("Error checking like status: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		c.JSON(200, gin.H{"liked": liked})
	}
}

// GetProfileViewersHandler retourne la liste des profils qui ont vu le profil de l'utilisateur
func GetProfileViewersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("userId")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		// Récupérer tous les utilisateurs qui ont vu ce profil
		rows, err := db.Query(`
			SELECT DISTINCT u.id, u.username, u.first_name, u.last_name, u.email, 
			       u.gender, u.orientation, u.birthday, u.bio, u.fame_rating,
			       COALESCE(ul.lat, 0) as latitude, COALESCE(ul.lon, 0) as longitude,
			       COALESCE(string_agg(t.name, ','), '') as tags,
			       MAX(pv.viewed_at) as last_viewed_at
			FROM users u
			JOIN profile_views pv ON u.id = pv.viewer_id
			LEFT JOIN user_locations ul ON u.id = ul.user_id
			LEFT JOIN user_tags ut ON u.id = ut.user_id
			LEFT JOIN tags t ON ut.tag_id = t.id
			WHERE pv.viewed_id = $1
			GROUP BY u.id, ul.lat, ul.lon
			ORDER BY last_viewed_at DESC
		`, userID)

		if err != nil {
			log.Printf("Error querying viewers: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		defer rows.Close()

		var viewers []map[string]interface{}
		for rows.Next() {
			var id int
			var username, firstName, lastName, email string
			var gender, orientation, bio, tags sql.NullString
			var birthday sql.NullTime
			var fameRating sql.NullFloat64
			var latitude, longitude sql.NullFloat64

			err := rows.Scan(&id, &username, &firstName, &lastName, &email,
				&gender, &orientation, &birthday, &bio, &fameRating,
				&latitude, &longitude, &tags)
			if err != nil {
				log.Printf("Error scanning viewer row: %v", err)
				continue
			}

			viewer := map[string]interface{}{
				"id":          id,
				"username":    username,
				"first_name":  firstName,
				"last_name":   lastName,
				"email":       email,
				"gender":      gender.String,
				"orientation": orientation.String,
				"birthday":    birthday.Time,
				"bio":         bio.String,
				"fame_rating": fameRating.Float64,
				"latitude":    latitude.Float64,
				"longitude":   longitude.Float64,
			}

			// Parse tags
			if tags.String != "" {
				viewer["tags"] = strings.Split(tags.String, ",")
			} else {
				viewer["tags"] = []string{}
			}

			viewers = append(viewers, viewer)
		}

		if err = rows.Err(); err != nil {
			log.Printf("Error iterating viewers: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		c.JSON(200, gin.H{"viewers": viewers})
	}
}

// GetProfileLikersHandler retourne la liste des profils qui ont liké le profil de l'utilisateur
func GetProfileLikersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("userId")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		// Récupérer tous les utilisateurs qui ont liké ce profil
		rows, err := db.Query(`
			SELECT DISTINCT u.id, u.username, u.first_name, u.last_name, u.email, 
			       u.gender, u.orientation, u.birthday, u.bio, u.fame_rating,
			       COALESCE(ul.lat, 0) as latitude, COALESCE(ul.lon, 0) as longitude,
			       COALESCE(string_agg(t.name, ','), '') as tags,
			       MAX(pl.liked_at) as last_liked_at
			FROM users u
			JOIN profile_likes pl ON u.id = pl.liker_id
			LEFT JOIN user_locations ul ON u.id = ul.user_id
			LEFT JOIN user_tags ut ON u.id = ut.user_id
			LEFT JOIN tags t ON ut.tag_id = t.id
			WHERE pl.liked_id = $1
			GROUP BY u.id, ul.lat, ul.lon
			ORDER BY last_liked_at DESC
		`, userID)

		if err != nil {
			log.Printf("Error querying likers: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		defer rows.Close()

		var likers []map[string]interface{}
		for rows.Next() {
			var id int
			var username, firstName, lastName, email string
			var gender, orientation, bio, tags sql.NullString
			var birthday sql.NullTime
			var fameRating sql.NullFloat64
			var latitude, longitude sql.NullFloat64

			err := rows.Scan(&id, &username, &firstName, &lastName, &email,
				&gender, &orientation, &birthday, &bio, &fameRating,
				&latitude, &longitude, &tags)
			if err != nil {
				log.Printf("Error scanning liker row: %v", err)
				continue
			}

			liker := map[string]interface{}{
				"id":          id,
				"username":    username,
				"first_name":  firstName,
				"last_name":   lastName,
				"email":       email,
				"gender":      gender.String,
				"orientation": orientation.String,
				"birthday":    birthday.Time,
				"bio":         bio.String,
				"fame_rating": fameRating.Float64,
				"latitude":    latitude.Float64,
				"longitude":   longitude.Float64,
			}

			// Parse tags
			if tags.String != "" {
				liker["tags"] = strings.Split(tags.String, ",")
			} else {
				liker["tags"] = []string{}
			}

			likers = append(likers, liker)
		}

		if err = rows.Err(); err != nil {
			log.Printf("Error iterating likers: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		c.JSON(200, gin.H{"likers": likers})
	}
}

// GetCurrentUserHandler retourne les informations de l'utilisateur connecté
func GetCurrentUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionToken, err := c.Cookie("session_token")
		if err != nil {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		var userID int
		var username, email, firstName, lastName string
		var gender, orientation, bio, avatarURL sql.NullString
		var birthday sql.NullTime
		var fameRating sql.NullFloat64

		err = db.QueryRow(`
			SELECT id, username, email, first_name, last_name, gender, orientation, 
			       birthday, bio, avatar_url, fame_rating
			FROM users 
			WHERE session_token = $1
		`, sessionToken).Scan(
			&userID, &username, &email, &firstName, &lastName,
			&gender, &orientation, &birthday, &bio, &avatarURL, &fameRating,
		)

		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(401, gin.H{"error": "Invalid session"})
			} else {
				log.Printf("Error fetching current user: %v", err)
				c.JSON(500, gin.H{"error": "Database error"})
			}
			return
		}

		response := gin.H{
			"id":         userID,
			"username":   username,
			"email":      email,
			"first_name": firstName,
			"last_name":  lastName,
		}

		if gender.Valid {
			response["gender"] = gender.String
		}
		if orientation.Valid {
			response["orientation"] = orientation.String
		}
		if birthday.Valid {
			response["birthday"] = birthday.Time.Format("2006-01-02")
		}
		if bio.Valid {
			response["bio"] = bio.String
		}
		if avatarURL.Valid {
			response["avatar_url"] = avatarURL.String
		}
		if fameRating.Valid {
			response["fame_rating"] = fameRating.Float64
		} else {
			response["fame_rating"] = 0.0
		}

		// Récupérer les tags de l'utilisateur
		tags := []string{}
		tagRows, err := db.Query(`
			SELECT t.name 
			FROM tags t 
			JOIN user_tags ut ON t.id = ut.tag_id 
			WHERE ut.user_id = $1
		`, userID)
		if err == nil {
			defer tagRows.Close()
			for tagRows.Next() {
				var tagName string
				if err := tagRows.Scan(&tagName); err == nil {
					tags = append(tags, tagName)
				}
			}
		}
		response["tags"] = tags

		// Récupérer la localisation de l'utilisateur
		var lat, lon sql.NullFloat64
		err = db.QueryRow(`
			SELECT lat, lon 
			FROM user_locations 
			WHERE user_id = $1
		`, userID).Scan(&lat, &lon)

		if err == nil && lat.Valid && lon.Valid {
			response["location"] = gin.H{
				"lat": lat.Float64,
				"lon": lon.Float64,
			}
		}

		c.JSON(200, response)
	}
}

// GetAllUsersHandler retourne tous les utilisateurs (pour les suggestions de profils)
func GetAllUsersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`
			SELECT id, username, first_name, last_name, email, gender, orientation, 
			       birthday, bio, avatar_url, fame_rating
			FROM users
			WHERE verified = true
		`)
		if err != nil {
			log.Printf("Error fetching users: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		defer rows.Close()

		users := []gin.H{}
		for rows.Next() {
			var userID int
			var username, email, firstName, lastName string
			var gender, orientation, bio, avatarURL sql.NullString
			var birthday sql.NullTime
			var fameRating sql.NullFloat64

			err := rows.Scan(
				&userID, &username, &firstName, &lastName, &email,
				&gender, &orientation, &birthday, &bio, &avatarURL, &fameRating,
			)
			if err != nil {
				log.Printf("Error scanning user: %v", err)
				continue
			}

			user := gin.H{
				"id":         userID,
				"username":   username,
				"email":      email,
				"first_name": firstName,
				"last_name":  lastName,
			}

			if gender.Valid {
				user["gender"] = gender.String
			}
			if orientation.Valid {
				user["orientation"] = orientation.String
			}
			if birthday.Valid {
				user["birthday"] = birthday.Time.Format("2006-01-02")
			}
			if bio.Valid {
				user["bio"] = bio.String
			}
			if avatarURL.Valid {
				user["avatar_url"] = avatarURL.String
			}
			if fameRating.Valid {
				user["fame_rating"] = fameRating.Float64
			} else {
				user["fame_rating"] = 0.0
			}

			// Récupérer les tags de l'utilisateur
			tags := []string{}
			tagRows, err := db.Query(`
				SELECT t.name 
				FROM tags t 
				JOIN user_tags ut ON t.id = ut.tag_id 
				WHERE ut.user_id = $1
			`, userID)
			if err == nil {
				defer tagRows.Close()
				for tagRows.Next() {
					var tagName string
					if err := tagRows.Scan(&tagName); err == nil {
						tags = append(tags, tagName)
					}
				}
			}
			user["tags"] = tags

			// Récupérer la localisation de l'utilisateur
			var lat, lon sql.NullFloat64
			err = db.QueryRow(`
				SELECT lat, lon 
				FROM user_locations 
				WHERE user_id = $1
			`, userID).Scan(&lat, &lon)

			if err == nil && lat.Valid && lon.Valid {
				user["latitude"] = lat.Float64
				user["longitude"] = lon.Float64
			}

			users = append(users, user)
		}

		c.JSON(200, gin.H{"users": users})
	}
}

// GetUserByIdHandler retourne un utilisateur spécifique par son ID
func GetUserByIdHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("userId")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		var username, email, firstName, lastName string
		var gender, orientation, bio, avatarURL sql.NullString
		var birthday sql.NullTime
		var fameRating sql.NullFloat64

		err = db.QueryRow(`
			SELECT username, email, first_name, last_name, gender, orientation, 
			       birthday, bio, avatar_url, fame_rating
			FROM users
			WHERE id = $1 AND verified = true
		`, userID).Scan(
			&username, &email, &firstName, &lastName,
			&gender, &orientation, &birthday, &bio, &avatarURL, &fameRating,
		)

		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{"error": "User not found"})
			return
		} else if err != nil {
			log.Printf("Error fetching user: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		user := gin.H{
			"id":         userID,
			"username":   username,
			"email":      email,
			"first_name": firstName,
			"last_name":  lastName,
		}

		if gender.Valid {
			user["gender"] = gender.String
		}
		if orientation.Valid {
			user["orientation"] = orientation.String
		}
		if birthday.Valid {
			user["birthday"] = birthday.Time.Format("2006-01-02")
		}
		if bio.Valid {
			user["bio"] = bio.String
		}
		if avatarURL.Valid {
			user["avatar_url"] = avatarURL.String
		}
		if fameRating.Valid {
			user["fame_rating"] = fameRating.Float64
		} else {
			user["fame_rating"] = 0.0
		}

		// Récupérer les tags de l'utilisateur
		tags := []string{}
		tagRows, err := db.Query(`
			SELECT t.name 
			FROM tags t 
			JOIN user_tags ut ON t.id = ut.tag_id 
			WHERE ut.user_id = $1
		`, userID)
		if err == nil {
			defer tagRows.Close()
			for tagRows.Next() {
				var tagName string
				if err := tagRows.Scan(&tagName); err == nil {
					tags = append(tags, tagName)
				}
			}
		}
		user["tags"] = tags

		// Récupérer la localisation de l'utilisateur
		var lat, lon sql.NullFloat64
		err = db.QueryRow(`
			SELECT lat, lon 
			FROM user_locations 
			WHERE user_id = $1
		`, userID).Scan(&lat, &lon)

		if err == nil && lat.Valid && lon.Valid {
			user["latitude"] = lat.Float64
			user["longitude"] = lon.Float64
		}

		c.JSON(200, user)
	}
}

// UpdateProfileHandler met à jour les informations du profil utilisateur
func UpdateProfileHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Récupérer l'ID de l'utilisateur depuis le contexte (middleware)
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

		var requestData struct {
			Gender      *string `json:"gender"`
			Orientation *string `json:"orientation"`
			Bio         *string `json:"bio"`
			FirstName   *string `json:"first_name"`
			LastName    *string `json:"last_name"`
			Birthday    *string `json:"birthday"`
		}

		if err := c.BindJSON(&requestData); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request data"})
			return
		}

		// Construire la requête de mise à jour dynamiquement
		updates := []string{}
		args := []interface{}{}
		argIndex := 1

		if requestData.Gender != nil {
			updates = append(updates, "gender = $"+strconv.Itoa(argIndex))
			args = append(args, *requestData.Gender)
			argIndex++
		}
		if requestData.Orientation != nil {
			updates = append(updates, "orientation = $"+strconv.Itoa(argIndex))
			args = append(args, *requestData.Orientation)
			argIndex++
		}
		if requestData.Bio != nil {
			updates = append(updates, "bio = $"+strconv.Itoa(argIndex))
			args = append(args, *requestData.Bio)
			argIndex++
		}
		if requestData.FirstName != nil {
			updates = append(updates, "first_name = $"+strconv.Itoa(argIndex))
			args = append(args, *requestData.FirstName)
			argIndex++
		}
		if requestData.LastName != nil {
			updates = append(updates, "last_name = $"+strconv.Itoa(argIndex))
			args = append(args, *requestData.LastName)
			argIndex++
		}
		if requestData.Birthday != nil {
			updates = append(updates, "birthday = $"+strconv.Itoa(argIndex))
			args = append(args, *requestData.Birthday)
			argIndex++
		}

		if len(updates) == 0 {
			c.JSON(400, gin.H{"error": "No fields to update"})
			return
		}

		// Ajouter l'ID utilisateur comme dernier argument
		args = append(args, userID)

		query := "UPDATE users SET " + updates[0]
		for i := 1; i < len(updates); i++ {
			query += ", " + updates[i]
		}
		query += " WHERE id = $" + strconv.Itoa(argIndex)

		_, err := db.Exec(query, args...)
		if err != nil {
			log.Printf("Error updating profile: %v", err)
			c.JSON(500, gin.H{"error": "Error updating profile"})
			return
		}

		c.JSON(200, gin.H{"message": "Profile updated successfully"})
	}
}

// UpdateEmailHandler met à jour l'email de l'utilisateur
func UpdateEmailHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Récupérer l'ID de l'utilisateur depuis le contexte (middleware)
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

		var requestData struct {
			Email string `json:"email"`
		}

		if err := c.BindJSON(&requestData); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request data"})
			return
		}

		if requestData.Email == "" {
			c.JSON(400, gin.H{"error": "Email is required"})
			return
		}

		// Vérifier si l'email existe déjà
		var emailExists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND id != $2)", requestData.Email, userID).Scan(&emailExists)
		if err != nil {
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		if emailExists {
			c.JSON(400, gin.H{"error": "Email already in use"})
			return
		}

		_, err = db.Exec("UPDATE users SET email = $1 WHERE id = $2", requestData.Email, userID)
		if err != nil {
			log.Printf("Error updating email: %v", err)
			c.JSON(500, gin.H{"error": "Error updating email"})
			return
		}

		c.JSON(200, gin.H{"message": "Email updated successfully"})
	}
}

// UpdateTagsHandler met à jour les tags/intérêts de l'utilisateur
func UpdateTagsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Récupérer l'ID de l'utilisateur depuis le contexte (middleware)
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

		var requestData struct {
			Tags []string `json:"tags"`
		}

		if err := c.BindJSON(&requestData); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request data"})
			return
		}

		// Commencer une transaction
		tx, err := db.Begin()
		if err != nil {
			c.JSON(500, gin.H{"error": "Error starting transaction"})
			return
		}
		defer tx.Rollback()

		// Supprimer tous les tags existants de l'utilisateur
		_, err = tx.Exec("DELETE FROM user_tags WHERE user_id = $1", userID)
		if err != nil {
			log.Printf("Error deleting old tags: %v", err)
			c.JSON(500, gin.H{"error": "Error updating tags"})
			return
		}

		// Ajouter les nouveaux tags
		for _, tagName := range requestData.Tags {
			if tagName == "" {
				continue
			}

			// Vérifier si le tag existe, sinon le créer
			var tagID int
			err := tx.QueryRow("SELECT id FROM tags WHERE name = $1", tagName).Scan(&tagID)
			if err == sql.ErrNoRows {
				// Le tag n'existe pas, le créer
				err = tx.QueryRow("INSERT INTO tags (name) VALUES ($1) RETURNING id", tagName).Scan(&tagID)
				if err != nil {
					log.Printf("Error creating tag: %v", err)
					c.JSON(500, gin.H{"error": "Error creating tag"})
					return
				}
			} else if err != nil {
				log.Printf("Error checking tag: %v", err)
				c.JSON(500, gin.H{"error": "Error checking tag"})
				return
			}

			// Associer le tag à l'utilisateur
			_, err = tx.Exec("INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2)", userID, tagID)
			if err != nil {
				log.Printf("Error associating tag: %v", err)
				c.JSON(500, gin.H{"error": "Error associating tag"})
				return
			}
		}

		// Valider la transaction
		if err := tx.Commit(); err != nil {
			log.Printf("Error committing transaction: %v", err)
			c.JSON(500, gin.H{"error": "Error committing changes"})
			return
		}

		c.JSON(200, gin.H{"message": "Tags updated successfully"})
	}
}

// GetSuggestionsHandler retourne les suggestions de profils filtrées par compatibilité mutuelle
func GetSuggestionsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Récupérer l'ID de l'utilisateur connecté
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

		// Récupérer les préférences d'orientation de l'utilisateur connecté
		var currentUserOrientation string
		err := db.QueryRow("SELECT COALESCE(orientation, 'likes men and women') FROM users WHERE id = $1", userID).Scan(&currentUserOrientation)
		if err != nil {
			log.Printf("Error fetching current user orientation: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		// Récupérer le genre de l'utilisateur connecté
		var currentUserGender string
		err = db.QueryRow("SELECT COALESCE(gender, 'Woman') FROM users WHERE id = $1", userID).Scan(&currentUserGender)
		if err != nil {
			log.Printf("Error fetching current user gender: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		// Déterminer les genres cibles pour l'utilisateur connecté
		// Parsons l'orientation correctement
		var targetGenders []string
		lowerOrientation := strings.ToLower(strings.TrimSpace(currentUserOrientation))

		// Check the exact format: "likes X"
		if lowerOrientation == "likes men and women" || lowerOrientation == "likes both" || lowerOrientation == "both" {
			targetGenders = []string{"Man", "Woman"}
		} else if lowerOrientation == "likes men" || lowerOrientation == "men" {
			targetGenders = []string{"Man"}
		} else if lowerOrientation == "likes women" || lowerOrientation == "women" {
			targetGenders = []string{"Woman"}
		} else if strings.HasSuffix(lowerOrientation, "men and women") {
			targetGenders = []string{"Man", "Woman"}
		} else if strings.HasSuffix(lowerOrientation, "men") {
			targetGenders = []string{"Man"}
		} else if strings.HasSuffix(lowerOrientation, "women") {
			targetGenders = []string{"Woman"}
		} else {
			// Default fallback
			targetGenders = []string{"Man", "Woman"}
		}

		// Créer placeholders pour IN clause et construire la clause de compatibilité d'orientation
		placeholders := ""
		orientationClauses := []string{}
		args := []interface{}{userID}

		for i, gender := range targetGenders {
			if i > 0 {
				placeholders += ","
			}
			placeholders += "$" + strconv.Itoa(len(args)+1)
			args = append(args, gender)

			// Pour chaque genre cible, ajouter une clause qui vérifie que le candidat de ce genre
			// aime le genre de l'utilisateur connecté
			if gender == "Man" {
				// Si on cherche des hommes, ils doivent aimer les femmes (si current user est Woman)
				// ou aimer les hommes (si current user est Man)
				if currentUserGender == "Woman" {
					orientationClauses = append(orientationClauses,
						"(u.gender = 'Man' AND (u.orientation = 'likes women' OR u.orientation = 'likes men and women'))")
				} else if currentUserGender == "Man" {
					orientationClauses = append(orientationClauses,
						"(u.gender = 'Man' AND (u.orientation = 'likes men' OR u.orientation = 'likes men and women'))")
				}
			} else if gender == "Woman" {
				// Si on cherche des femmes, elles doivent aimer les femmes (si current user est Woman)
				// ou aimer les hommes (si current user est Man)
				if currentUserGender == "Woman" {
					orientationClauses = append(orientationClauses,
						"(u.gender = 'Woman' AND (u.orientation = 'likes women' OR u.orientation = 'likes men and women'))")
				} else if currentUserGender == "Man" {
					orientationClauses = append(orientationClauses,
						"(u.gender = 'Woman' AND (u.orientation = 'likes men' OR u.orientation = 'likes men and women'))")
				}
			}
		}

		orientationFilter := strings.Join(orientationClauses, " OR ")

		// Récupérer les paramètres de filtrage optionnels depuis query params
		minAgeStr := c.DefaultQuery("minAge", "")
		maxAgeStr := c.DefaultQuery("maxAge", "")
		minFameStr := c.DefaultQuery("minFame", "")
		maxDistanceStr := c.DefaultQuery("maxDistance", "")

		// Construire les clauses de filtrage supplémentaires
		var additionalFilters []string

		// Filtre par âge si spécifié
		if minAgeStr != "" || maxAgeStr != "" {
			minAge := 18
			maxAge := 99

			if minAgeStr != "" {
				if v, err := strconv.Atoi(minAgeStr); err == nil {
					minAge = v
				}
			}
			if maxAgeStr != "" {
				if v, err := strconv.Atoi(maxAgeStr); err == nil {
					maxAge = v
				}
			}

			currentYear := time.Now().Year()
			maxBirthYear := currentYear - minAge
			minBirthYear := currentYear - maxAge

			additionalFilters = append(additionalFilters,
				fmt.Sprintf("EXTRACT(YEAR FROM u.birthday) BETWEEN %d AND %d", minBirthYear, maxBirthYear))
		}

		// Filtre par fame rating si spécifié
		if minFameStr != "" {
			if v, err := strconv.ParseFloat(minFameStr, 64); err == nil {
				additionalFilters = append(additionalFilters, fmt.Sprintf("u.fame_rating >= %.2f", v))
			}
		}

		// Filtre par distance si spécifié
		if maxDistanceStr != "" {
			if maxDist, err := strconv.ParseFloat(maxDistanceStr, 64); err == nil && maxDist > 0 {
				// Récupérer la localisation de l'utilisateur connecté
				var userLat, userLon sql.NullFloat64
				err = db.QueryRow(`
					SELECT lat, lon FROM user_locations WHERE user_id = $1
				`, userID).Scan(&userLat, &userLon)

				if err == nil && userLat.Valid && userLon.Valid {
					// Formule Haversine : 6371 km = rayon de la terre
					additionalFilters = append(additionalFilters, fmt.Sprintf(`
						(6371 * 2 * ASIN(SQRT(
							POWER(SIN(RADIANS((u_loc.lat - %f) / 2)), 2) + 
							COS(RADIANS(%f)) * COS(RADIANS(u_loc.lat)) * 
							POWER(SIN(RADIANS((u_loc.lon - %f) / 2)), 2)
						)) <= %f OR u_loc.lat IS NULL)
					`, userLat.Float64, userLat.Float64, userLon.Float64, maxDist))
				}
			}
		}

		// Construire la clause WHERE complète
		additionalFilterClause := ""
		if len(additionalFilters) > 0 {
			additionalFilterClause = " AND " + strings.Join(additionalFilters, " AND ")
		}

		// Récupérer tous les utilisateurs vérifiés dont le genre correspond aux préférences
		// ET dont l'orientation accepte le genre de l'utilisateur connecté
		query := `
			SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.gender, u.orientation, 
			       u.birthday, u.bio, u.avatar_url, u.fame_rating
			FROM users u
			LEFT JOIN user_locations u_loc ON u.id = u_loc.user_id
			WHERE u.verified = true 
			  AND u.id != $1
			  AND u.gender IN (` + placeholders + `)
			  AND (` + orientationFilter + `)` + additionalFilterClause

		// DEBUG: Log the query and parameters
		log.Printf("DEBUG GetSuggestions - UserID: %d, Gender: %s, Orientation: %s", userID, currentUserGender, currentUserOrientation)
		log.Printf("DEBUG GetSuggestions - Target genders: %v", targetGenders)
		log.Printf("DEBUG GetSuggestions - Orientation filter: %s", orientationFilter)
		log.Printf("DEBUG GetSuggestions - Query: %s", query)
		log.Printf("DEBUG GetSuggestions - Args: %v", args)

		rows, err := db.Query(query, args...)
		if err != nil {
			log.Printf("Error querying suggestions: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		defer rows.Close()

		users := []gin.H{}
		for rows.Next() {
			var userID int
			var username, email, firstName, lastName string
			var gender, orientation, bio, avatarURL sql.NullString
			var birthday sql.NullTime
			var fameRating sql.NullFloat64

			err := rows.Scan(
				&userID, &username, &firstName, &lastName, &email,
				&gender, &orientation, &birthday, &bio, &avatarURL, &fameRating,
			)
			if err != nil {
				log.Printf("Error scanning user: %v", err)
				continue
			}

			user := gin.H{
				"id":         userID,
				"username":   username,
				"email":      email,
				"first_name": firstName,
				"last_name":  lastName,
			}

			if gender.Valid {
				user["gender"] = gender.String
			}
			if orientation.Valid {
				user["orientation"] = orientation.String
			}
			if birthday.Valid {
				user["birthday"] = birthday.Time.Format("2006-01-02")
			}
			if bio.Valid {
				user["bio"] = bio.String
			}
			if avatarURL.Valid {
				user["avatar_url"] = avatarURL.String
			}
			if fameRating.Valid {
				user["fame_rating"] = fameRating.Float64
			} else {
				user["fame_rating"] = 0.0
			}

			// Récupérer les tags de l'utilisateur
			tags := []string{}
			tagRows, err := db.Query(`
				SELECT t.name 
				FROM tags t 
				JOIN user_tags ut ON t.id = ut.tag_id 
				WHERE ut.user_id = $1
			`, userID)
			if err == nil {
				defer tagRows.Close()
				for tagRows.Next() {
					var tagName string
					if err := tagRows.Scan(&tagName); err == nil {
						tags = append(tags, tagName)
					}
				}
			}
			user["tags"] = tags

			// Récupérer la localisation de l'utilisateur
			var lat, lon sql.NullFloat64
			err = db.QueryRow(`
				SELECT lat, lon 
				FROM user_locations 
				WHERE user_id = $1
			`, userID).Scan(&lat, &lon)

			if err == nil && lat.Valid && lon.Valid {
				user["latitude"] = lat.Float64
				user["longitude"] = lon.Float64
			}

			users = append(users, user)
		}

		c.JSON(200, gin.H{"users": users})
	}
}
