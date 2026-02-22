package main

import (
	"database/sql"
	"log"
	"strconv"

	"github.com/gin-gonic/gin"
)

func BlockUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		blockerIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		blockerID := blockerIDVal.(int)

		blockedIDStr := c.Param("userId")
		blockedID, err := strconv.Atoi(blockedIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		if blockerID == blockedID {
			c.JSON(400, gin.H{"error": "Cannot block yourself"})
			return
		}

		_, err = db.Exec(`
			INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)
			ON CONFLICT DO NOTHING
		`, blockerID, blockedID)

		if err != nil {
			log.Printf("Error blocking user: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		db.Exec("DELETE FROM profile_likes WHERE (liker_id = $1 AND liked_id = $2) OR (liker_id = $2 AND liked_id = $1)", blockerID, blockedID)

		c.JSON(200, gin.H{"message": "User blocked"})
	}
}

func ReportUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		reporterIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		reporterID := reporterIDVal.(int)

		reportedIDStr := c.Param("userId")
		reportedID, err := strconv.Atoi(reportedIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		var request struct {
			Reason string `json:"reason" binding:"required"`
		}
		if err := c.BindJSON(&request); err != nil {
			c.JSON(400, gin.H{"error": "Reason is required"})
			return
		}

		_, err = db.Exec("INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)", reporterID, reportedID, request.Reason)
		if err != nil {
			log.Printf("Error reporting user: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		c.JSON(200, gin.H{"message": "User reported"})
	}
}

func GetBlockedUsersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		userID := userIDVal.(int)

		rows, err := db.Query(`
			SELECT u.id, u.username, u.first_name, u.last_name, u.avatar_url
			FROM users u
			JOIN blocks b ON b.blocked_id = u.id
			WHERE b.blocker_id = $1
			ORDER BY b.created_at DESC
		`, userID)
		if err != nil {
			log.Printf("Error fetching blocked users: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		defer rows.Close()

		blockedUsers := []gin.H{}
		for rows.Next() {
			var id int
			var username, firstName, lastName string
			var avatarURL sql.NullString
			if err := rows.Scan(&id, &username, &firstName, &lastName, &avatarURL); err == nil {
				user := gin.H{
					"id":         id,
					"username":   username,
					"first_name": firstName,
					"last_name":  lastName,
				}
				if avatarURL.Valid {
					user["avatar_url"] = avatarURL.String
				}
				blockedUsers = append(blockedUsers, user)
			}
		}

		c.JSON(200, gin.H{"blocked_users": blockedUsers})
	}
}

func UnblockUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		userID := userIDVal.(int)

		blockedIDStr := c.Param("userId")
		blockedID, err := strconv.Atoi(blockedIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		result, err := db.Exec("DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2", userID, blockedID)
		if err != nil {
			log.Printf("Error unblocking user: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{"error": "Block not found"})
			return
		}

		c.JSON(200, gin.H{"message": "User unblocked"})
	}
}
