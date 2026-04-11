package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"strconv"

	"github.com/gin-gonic/gin"
)

func SendMessageHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		senderIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		senderID := senderIDVal.(int)

		var request struct {
			ReceiverID int    `json:"receiver_id" binding:"required"`
			Content    string `json:"content" binding:"required"`
		}

		if err := c.BindJSON(&request); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request"})
			return
		}

		if senderID == request.ReceiverID {
			c.JSON(400, gin.H{"error": "Cannot message yourself"})
			return
		}

		var isConnected bool
		err := db.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM profile_likes WHERE liker_id = $1 AND liked_id = $2
			) AND EXISTS(
				SELECT 1 FROM profile_likes WHERE liker_id = $2 AND liked_id = $1
			)
		`, senderID, request.ReceiverID).Scan(&isConnected)

		if err != nil {
			c.JSON(500, gin.H{"error": "Database error checking connection"})
			return
		}

		if !isConnected {
			c.JSON(403, gin.H{"error": "You must be connected (mutual like) to chat"})
			return
		}

		var isBlocked bool
		err = db.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)
			)
		`, senderID, request.ReceiverID).Scan(&isBlocked)

		if err != nil {
			c.JSON(500, gin.H{"error": "Database error checking block status"})
			return
		}
		if isBlocked {
			c.JSON(403, gin.H{"error": "You cannot chat with this user"})
			return
		}

		var messageID int
		var createdAt string
		err = db.QueryRow(`
			INSERT INTO messages (sender_id, receiver_id, content) 
			VALUES ($1, $2, $3)
			RETURNING id, created_at
		`, senderID, request.ReceiverID, request.Content).Scan(&messageID, &createdAt)

		if err != nil {
			log.Printf("Error sending message: %v", err)
			c.JSON(500, gin.H{"error": "Error sending message"})
			return
		}

		var senderUsername, senderFirstName string
		db.QueryRow("SELECT username, first_name FROM users WHERE id = $1", senderID).Scan(&senderUsername, &senderFirstName)

		chatMessage := map[string]interface{}{
			"type":        "chat_message",
			"id":          messageID,
			"sender_id":   senderID,
			"receiver_id": request.ReceiverID,
			"content":     request.Content,
			"created_at":  createdAt,
			"sender_name": senderFirstName,
		}
		jsonData, err := json.Marshal(chatMessage)
		if err == nil {
			SendToUser(request.ReceiverID, jsonData)
		}

		CreateAndPushNotification(db, request.ReceiverID, "message", senderID, "New message from "+senderFirstName)

		c.JSON(200, gin.H{"message": "Message sent", "id": messageID})
	}
}

func GetChatHistoryHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		currentUserID := userIDVal.(int)

		otherUserIDStr := c.Param("userId")
		otherUserID, err := strconv.Atoi(otherUserIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		rows, err := db.Query(`
			SELECT id, sender_id, receiver_id, content, created_at, read_at
			FROM messages
			WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
			ORDER BY created_at ASC
		`, currentUserID, otherUserID)

		if err != nil {
			log.Printf("Error fetching messages: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		defer rows.Close()

		messages := []gin.H{}
		for rows.Next() {
			var id, senderID, receiverID int
			var content, createdAt string
			var readAt sql.NullString

			if err := rows.Scan(&id, &senderID, &receiverID, &content, &createdAt, &readAt); err != nil {
				continue
			}

			msg := gin.H{
				"id":          id,
				"sender_id":   senderID,
				"receiver_id": receiverID,
				"content":     content,
				"created_at":  createdAt,
			}
			if readAt.Valid {
				msg["read_at"] = readAt.String
			}
			messages = append(messages, msg)
		}

		c.JSON(200, gin.H{"messages": messages})
	}
}

func GetConversationsHandler(db *sql.DB) gin.HandlerFunc {
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
			JOIN profile_likes l1 ON l1.liker_id = $1 AND l1.liked_id = u.id
			JOIN profile_likes l2 ON l2.liker_id = u.id AND l2.liked_id = $1
			WHERE NOT EXISTS (
				SELECT 1 FROM blocks b WHERE (b.blocker_id = $1 AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = $1)
			)
		`, userID)

		if err != nil {
			log.Printf("Error fetching conversations: %v", err)
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		defer rows.Close()

		users := []gin.H{}
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
				users = append(users, user)
			}
		}

		c.JSON(200, gin.H{"conversations": users})
	}
}
