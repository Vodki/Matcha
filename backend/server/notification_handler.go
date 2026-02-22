package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateAndPushNotification(db *sql.DB, userID int, notifType string, sourceID int, message string) {
	var notifID int
	err := db.QueryRow(`
		INSERT INTO notifications (user_id, type, source_id, message, is_read, created_at)
		VALUES ($1, $2, $3, $4, FALSE, NOW())
		RETURNING id
	`, userID, notifType, sourceID, message).Scan(&notifID)

	if err != nil {
		log.Printf("Error creating notification: %v", err)
		return
	}

	notification := map[string]interface{}{
		"type":      "notification",
		"id":        notifID,
		"notifType": notifType,
		"sourceId":  sourceID,
		"message":   message,
		"isRead":    false,
	}

	jsonData, err := json.Marshal(notification)
	if err == nil {
		SendToUser(userID, jsonData)
	}
}

func GetNotificationsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		userID := userIDVal.(int)

		rows, err := db.Query(`
			SELECT id, type, source_id, message, is_read, created_at
			FROM notifications
			WHERE user_id = $1
			ORDER BY created_at DESC
			LIMIT 50
		`, userID)
		if err != nil {
			log.Printf("Error fetching notifications: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		defer rows.Close()

		type Notification struct {
			ID        int     `json:"id"`
			Type      string  `json:"type"`
			SourceID  *int    `json:"source_id"`
			Message   *string `json:"message"`
			IsRead    bool    `json:"is_read"`
			CreatedAt string  `json:"created_at"`
		}

		var notifs []Notification
		for rows.Next() {
			var n Notification
			if err := rows.Scan(&n.ID, &n.Type, &n.SourceID, &n.Message, &n.IsRead, &n.CreatedAt); err == nil {
				notifs = append(notifs, n)
			}
		}

		c.JSON(200, gin.H{"notifications": notifs})
	}
}

func MarkNotificationReadHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		userID := userIDVal.(int)

		notifIDStr := c.Param("id")
		notifID, err := strconv.Atoi(notifIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid notification ID"})
			return
		}

		result, err := db.Exec("UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2", notifID, userID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{"error": "Notification not found"})
			return
		}

		c.JSON(200, gin.H{"message": "Marked as read"})
	}
}
