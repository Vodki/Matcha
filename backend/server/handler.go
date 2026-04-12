package main

import (
	"database/sql"
	"fmt"
	"log"
	"matcha/utils"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0

	dLat := (lat2 - lat1) * math.Pi / 180.0
	dLon := (lon2 - lon1) * math.Pi / 180.0

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180.0)*math.Cos(lat2*math.Pi/180.0)*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}

func RegisterHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		username := c.PostForm("username")
		password := c.PostForm("password")
		email := c.PostForm("email")
		lastName := c.PostForm("last_name")
		firstName := c.PostForm("first_name")
		birthday := c.PostForm("birthday")

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
			`INSERT INTO users (email, password_hash, first_name, last_name, username, birthday) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
			email, hashedPassword, firstName, lastName, username, birthday,
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

		var tagID int
		err := db.QueryRow("SELECT id FROM tags WHERE name = $1", tagName).Scan(&tagID)
		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{"error": "Tag not found"})
			return
		} else if err != nil {
			c.JSON(500, gin.H{"error": "Database error while fetching tag", "details": err.Error()})
			return
		}

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

		_, err = db.Exec("DELETE FROM user_tags WHERE user_id = $1 AND tag_id = $2", userID, tagID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Error deleting user tag association", "details": err.Error()})
			return
		}

		c.JSON(200, gin.H{"message": "User tag deleted successfully"})
	}
}

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

		if request.Latitude < -90 || request.Latitude > 90 {
			c.JSON(400, gin.H{"error": "Latitude must be between -90 and 90"})
			return
		}
		if request.Longitude < -180 || request.Longitude > 180 {
			c.JSON(400, gin.H{"error": "Longitude must be between -180 and 180"})
			return
		}

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

		radiusKm := 200.0
		if radiusStr := c.Query("radius"); radiusStr != "" {
			if parsedRadius, err := strconv.ParseFloat(radiusStr, 64); err == nil && parsedRadius > 0 {
				radiusKm = parsedRadius
			}
		}

		limit := 50
		if limitStr := c.Query("limit"); limitStr != "" {
			if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
				limit = parsedLimit
			}
		}

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

func RequestPasswordResetHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		email := c.PostForm("email")

		if email == "" {
			c.JSON(400, gin.H{"error": "Email is required"})
			return
		}

		var userID int
		var username string
		err := db.QueryRow("SELECT id, username FROM users WHERE email = $1", email).Scan(&userID, &username)
		if err == sql.ErrNoRows {
			c.JSON(200, gin.H{"message": "If this email exists, a password reset link has been sent"})
			return
		} else if err != nil {
			log.Printf("Error checking user: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		resetToken := utils.GenerateToken()
		expiresAt := time.Now().Add(1 * time.Hour)

		_, err = db.Exec(
			"UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3",
			resetToken, expiresAt, userID,
		)
		if err != nil {
			log.Printf("Error saving reset token: %v", err)
			c.JSON(500, gin.H{"error": "Error generating reset token"})
			return
		}

		err = utils.SendPasswordResetEmail(email, resetToken, username)
		if err != nil {
			log.Printf("Error sending reset email: %v", err)
			c.JSON(500, gin.H{"error": "Error sending reset email"})
			return
		}

		c.JSON(200, gin.H{"message": "If this email exists, a password reset link has been sent"})
	}
}

func ResetPasswordHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.PostForm("token")
		newPassword := c.PostForm("password")

		if token == "" || newPassword == "" {
			c.JSON(400, gin.H{"error": "Token and new password are required"})
			return
		}

		if err := utils.ValidatePassword(newPassword); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

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

		if time.Now().After(expiresAt) {
			c.JSON(400, gin.H{"error": "Reset token has expired"})
			return
		}

		hashedPassword, err := utils.HashPassword(newPassword)
		if err != nil {
			c.JSON(500, gin.H{"error": "Error hashing password"})
			return
		}

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

func RecordProfileViewHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		viewerID := userIDInterface.(int)

		viewedIDStr := c.Param("userId")
		viewedID, err := strconv.Atoi(viewedIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		if viewerID == viewedID {
			c.JSON(200, gin.H{"message": "Cannot view own profile"})
			return
		}

		result, err := db.Exec(
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

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected > 0 {
			var viewerName string
			db.QueryRow("SELECT first_name FROM users WHERE id = $1", viewerID).Scan(&viewerName)
			CreateAndPushNotification(db, viewedID, "visit", viewerID, viewerName+" viewed your profile")
		}

		c.JSON(200, gin.H{"message": "View recorded successfully"})
	}
}

func ToggleProfileLikeHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
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

		if likerID == likedID {
			c.JSON(400, gin.H{"error": "Cannot like own profile"})
			return
		}

		var hasProfilePicture bool
		err = db.QueryRow(
			"SELECT EXISTS(SELECT 1 FROM user_images WHERE user_id = $1 AND is_profile_picture = TRUE)",
			likerID,
		).Scan(&hasProfilePicture)
		if err != nil {
			log.Printf("Error checking profile picture: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		if !hasProfilePicture {
			c.JSON(403, gin.H{"error": "You need a profile picture to like other profiles"})
			return
		}

		var likerName string
		db.QueryRow("SELECT first_name FROM users WHERE id = $1", likerID).Scan(&likerName)

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
			var wasConnected bool
			db.QueryRow(
				"SELECT EXISTS(SELECT 1 FROM profile_likes WHERE liker_id = $1 AND liked_id = $2)",
				likedID, likerID,
			).Scan(&wasConnected)

			_, err = db.Exec(
				"DELETE FROM profile_likes WHERE liker_id = $1 AND liked_id = $2",
				likerID, likedID,
			)
			if err != nil {
				log.Printf("Error removing like: %v", err)
				c.JSON(500, gin.H{"error": "Error removing like"})
				return
			}

			if wasConnected {
				CreateAndPushNotification(db, likedID, "unlike", likerID, likerName+" unliked you")
			}

			c.JSON(200, gin.H{"message": "Like removed", "liked": false})
		} else {
			_, err = db.Exec(
				"INSERT INTO profile_likes (liker_id, liked_id) VALUES ($1, $2)",
				likerID, likedID,
			)
			if err != nil {
				log.Printf("Error adding like: %v", err)
				c.JSON(500, gin.H{"error": "Error adding like"})
				return
			}

			var isMatch bool
			db.QueryRow(
				"SELECT EXISTS(SELECT 1 FROM profile_likes WHERE liker_id = $1 AND liked_id = $2)",
				likedID, likerID,
			).Scan(&isMatch)

			if isMatch {
				var likedName string
				db.QueryRow("SELECT first_name FROM users WHERE id = $1", likedID).Scan(&likedName)
				CreateAndPushNotification(db, likedID, "match", likerID, "You matched with "+likerName+"!")
				CreateAndPushNotification(db, likerID, "match", likedID, "You matched with "+likedName+"!")
			} else {
				CreateAndPushNotification(db, likedID, "like", likerID, likerName+" liked your profile")
			}

			c.JSON(200, gin.H{"message": "Like added", "liked": true})
		}
	}
}

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

		err = db.QueryRow("SELECT COUNT(*) FROM profile_views WHERE viewed_id = $1", userID).Scan(&viewsCount)
		if err != nil {
			log.Printf("Error counting views: %v", err)
			viewsCount = 0
		}

		err = db.QueryRow("SELECT COUNT(*) FROM profile_likes WHERE liked_id = $1", userID).Scan(&likesCount)
		if err != nil {
			log.Printf("Error counting likes: %v", err)
			likesCount = 0
		}

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

func CheckLikeStatusHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
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

func GetProfileViewersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("userId")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

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
			var lastViewedAt sql.NullTime

			err := rows.Scan(&id, &username, &firstName, &lastName, &email,
				&gender, &orientation, &birthday, &bio, &fameRating,
				&latitude, &longitude, &tags, &lastViewedAt)
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

			if tags.String != "" {
				viewer["tags"] = strings.Split(tags.String, ",")
			} else {
				viewer["tags"] = []string{}
			}
			viewer["interests"] = viewer["tags"]

			imageRows, err := db.Query(`
SELECT path FROM user_images 
WHERE user_id = $1 
ORDER BY is_profile_picture DESC, id ASC
`, id)
			if err == nil {
				defer imageRows.Close()
				var images []string
				for imageRows.Next() {
					var path string
					if err := imageRows.Scan(&path); err == nil {
						images = append(images, path)
					}
				}
				viewer["images"] = images

			} else {
				viewer["images"] = []string{}
				log.Printf("ERROR: Failed to fetch images for viewer ID %d: %v", id, err)
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

func GetProfileLikersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("userId")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

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
			var lastLikedAt sql.NullTime
			var birthday sql.NullTime
			var fameRating sql.NullFloat64
			var latitude, longitude sql.NullFloat64

			err := rows.Scan(&id, &username, &firstName, &lastName, &email,
				&gender, &orientation, &birthday, &bio, &fameRating,
				&latitude, &longitude, &tags, &lastLikedAt)
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

			if tags.String != "" {
				liker["tags"] = strings.Split(tags.String, ",")
			} else {
				liker["tags"] = []string{}
			}
			liker["interests"] = liker["tags"]

			imageRows, err := db.Query(`
SELECT path FROM user_images 
WHERE user_id = $1 
ORDER BY is_profile_picture DESC, id ASC
`, id)
			if err == nil {
				defer imageRows.Close()
				var images []string
				for imageRows.Next() {
					var path string
					if err := imageRows.Scan(&path); err == nil {
						images = append(images, path)
					}
				}
				liker["images"] = images
			} else {
				liker["images"] = []string{}
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

		imageRows, err := db.Query(`
			SELECT path FROM user_images 
			WHERE user_id = $1 
			ORDER BY is_profile_picture DESC, id ASC
		`, userID)
		if err == nil {
			defer imageRows.Close()
			var images []string
			for imageRows.Next() {
				var path string
				if err := imageRows.Scan(&path); err == nil {
					images = append(images, path)
				}
			}
			user["images"] = images

		} else {
			user["images"] = []string{}
			log.Printf("ERROR: Failed to fetch images for user ID %d: %v", userID, err)
		}

		c.JSON(200, user)
	}
}

func UpdateProfileHandler(db *sql.DB) gin.HandlerFunc {
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

func UpdateEmailHandler(db *sql.DB) gin.HandlerFunc {
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

func UpdateTagsHandler(db *sql.DB) gin.HandlerFunc {
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

		var requestData struct {
			Tags []string `json:"tags"`
		}

		if err := c.BindJSON(&requestData); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request data"})
			return
		}

		tx, err := db.Begin()
		if err != nil {
			c.JSON(500, gin.H{"error": "Error starting transaction"})
			return
		}
		defer tx.Rollback()

		_, err = tx.Exec("DELETE FROM user_tags WHERE user_id = $1", userID)
		if err != nil {
			log.Printf("Error deleting old tags: %v", err)
			c.JSON(500, gin.H{"error": "Error updating tags"})
			return
		}

		for _, tagName := range requestData.Tags {
			if tagName == "" {
				continue
			}
			var tagID int
			err := tx.QueryRow("SELECT id FROM tags WHERE name = $1", tagName).Scan(&tagID)
			if err == sql.ErrNoRows {
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

			_, err = tx.Exec("INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2)", userID, tagID)
			if err != nil {
				log.Printf("Error associating tag: %v", err)
				c.JSON(500, gin.H{"error": "Error associating tag"})
				return
			}
		}

		if err := tx.Commit(); err != nil {
			log.Printf("Error committing transaction: %v", err)
			c.JSON(500, gin.H{"error": "Error committing changes"})
			return
		}

		c.JSON(200, gin.H{"message": "Tags updated successfully"})
	}
}

func GetSuggestionsHandler(db *sql.DB) gin.HandlerFunc {
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

		var currentUserOrientation string
		err := db.QueryRow("SELECT COALESCE(orientation, 'likes men and women') FROM users WHERE id = $1", userID).Scan(&currentUserOrientation)
		if err != nil {
			log.Printf("Error fetching current user orientation: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		var currentUserGender string
		err = db.QueryRow("SELECT COALESCE(gender, 'Woman') FROM users WHERE id = $1", userID).Scan(&currentUserGender)
		if err != nil {
			log.Printf("Error fetching current user gender: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		currentUserTags := []string{}
		currentTagRows, err := db.Query(`
		SELECT t.name FROM tags t 
		JOIN user_tags ut ON t.id = ut.tag_id 
		WHERE ut.user_id = $1
	`, userID)
		if err == nil {
			defer currentTagRows.Close()
			for currentTagRows.Next() {
				var tagName string
				if currentTagRows.Scan(&tagName) == nil {
					currentUserTags = append(currentUserTags, tagName)
				}
			}
		}

		var currentUserLat, currentUserLon sql.NullFloat64
		err = db.QueryRow(`
		SELECT lat, lon FROM user_locations WHERE user_id = $1
	`, userID).Scan(&currentUserLat, &currentUserLon)

		var targetGenders []string
		lowerOrientation := strings.ToLower(strings.TrimSpace(currentUserOrientation))

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
			targetGenders = []string{"Man", "Woman"}
		}

		placeholders := ""
		orientationClauses := []string{}
		args := []interface{}{userID}

		for i, gender := range targetGenders {
			if i > 0 {
				placeholders += ","
			}
			placeholders += "$" + strconv.Itoa(len(args)+1)
			args = append(args, gender)

			if gender == "Man" {
				if currentUserGender == "Woman" {
					orientationClauses = append(orientationClauses,
						"(u.gender = 'Man' AND (u.orientation = 'likes women' OR u.orientation = 'likes men and women'))")
				} else if currentUserGender == "Man" {
					orientationClauses = append(orientationClauses,
						"(u.gender = 'Man' AND (u.orientation = 'likes men' OR u.orientation = 'likes men and women'))")
				}
			} else if gender == "Woman" {
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

		minAgeStr := c.DefaultQuery("minAge", "")
		maxAgeStr := c.DefaultQuery("maxAge", "")
		minFameStr := c.DefaultQuery("minFame", "")
		maxDistanceStr := c.DefaultQuery("maxDistance", "")

		var additionalFilters []string

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

		if minFameStr != "" {
			if v, err := strconv.ParseFloat(minFameStr, 64); err == nil {
				additionalFilters = append(additionalFilters, fmt.Sprintf("u.fame_rating >= %.2f", v))
			}
		}

		if maxDistanceStr != "" {
			if maxDist, err := strconv.ParseFloat(maxDistanceStr, 64); err == nil && maxDist > 0 {
				var userLat, userLon sql.NullFloat64
				err = db.QueryRow(`
					SELECT lat, lon FROM user_locations WHERE user_id = $1
				`, userID).Scan(&userLat, &userLon)

				if err == nil && userLat.Valid && userLon.Valid {
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

		additionalFilterClause := ""
		if len(additionalFilters) > 0 {
			additionalFilterClause = " AND " + strings.Join(additionalFilters, " AND ")
		}

		query := `
			SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.gender, u.orientation, 
			       u.birthday, u.bio, u.avatar_url, u.fame_rating, u.last_seen
			FROM users u
			LEFT JOIN user_locations u_loc ON u.id = u_loc.user_id
			WHERE u.verified = true 
			  AND u.id != $1
			  AND u.gender IN (` + placeholders + `)
			  AND (` + orientationFilter + `)
			  AND NOT EXISTS (
			    SELECT 1 FROM blocks
			    WHERE (blocker_id = $1 AND blocked_id = u.id)
			       OR (blocker_id = u.id AND blocked_id = $1)
			  )` + additionalFilterClause

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
			var birthday, lastSeen sql.NullTime
			var fameRating sql.NullFloat64

			err := rows.Scan(
				&userID, &username, &firstName, &lastName, &email,
				&gender, &orientation, &birthday, &bio, &avatarURL, &fameRating, &lastSeen,
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

			isOnline := false
			if lastSeen.Valid {
				timeSinceLastSeen := time.Since(lastSeen.Time)
				isOnline = timeSinceLastSeen < 5*time.Minute
				user["last_seen"] = lastSeen.Time.Format(time.RFC3339)
			}
			user["is_online"] = isOnline

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

			var lat, lon sql.NullFloat64
			err = db.QueryRow(`
				SELECT lat, lon 
				FROM user_locations 
				WHERE user_id = $1
			`, userID).Scan(&lat, &lon)

			if err == nil && lat.Valid && lon.Valid {
				user["latitude"] = lat.Float64
				user["longitude"] = lon.Float64

				if currentUserLat.Valid && currentUserLon.Valid {
					distance := haversineDistance(
						currentUserLat.Float64, currentUserLon.Float64,
						lat.Float64, lon.Float64,
					)
					user["distance_km"] = distance
				} else {
					user["distance_km"] = -1
				}
			} else {
				user["distance_km"] = -1
			}

			commonCount := 0
			for _, tag := range tags {
				for _, currentTag := range currentUserTags {
					if tag == currentTag {
						commonCount++
						break
					}
				}
			}

			totalTags := len(currentUserTags) + len(tags) - commonCount
			matchScore := 0.0
			if totalTags > 0 {
				matchScore = (float64(commonCount) / float64(totalTags)) * 100
			}
			user["match_score"] = matchScore
			user["common_tags"] = commonCount

			users = append(users, user)
		}

		c.JSON(200, gin.H{"users": users})
	}
}
