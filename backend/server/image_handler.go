package main

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"matcha/utils"
)

func UploadImageHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		userID := userIDVal.(int)

		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM user_images WHERE user_id = $1", userID).Scan(&count)
		if err != nil {
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		if count >= 5 {
			c.JSON(400, gin.H{"error": "Maximum 5 images allowed"})
			return
		}

		file, err := c.FormFile("image")
		if err != nil {
			c.JSON(400, gin.H{"error": "Image file is required"})
			return
		}

		if err := utils.ValidateImage(file); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		uploadDir := "./uploads"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			os.Mkdir(uploadDir, 0755)
		}
		ext := filepath.Ext(file.Filename)
		filename := uuid.New().String() + ext
		savePath := filepath.Join(uploadDir, filename)

		if err := c.SaveUploadedFile(file, savePath); err != nil {
			log.Printf("Error saving file: %v", err)
			c.JSON(500, gin.H{"error": "Failed to save file"})
			return
		}

		webPath := "/uploads/" + filename

		isProfilePic := (count == 0)

		_, err = db.Exec("INSERT INTO user_images (user_id, path, is_profile_picture) VALUES ($1, $2, $3)", userID, webPath, isProfilePic)
		if err != nil {
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		if isProfilePic {
			db.Exec("UPDATE users SET avatar_url = $1 WHERE id = $2", webPath, userID)
		}

		c.JSON(200, gin.H{"message": "Image uploaded", "path": webPath, "is_profile_picture": isProfilePic})
	}
}

func DeleteImageHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		userID := userIDVal.(int)

		imageIDStr := c.Param("imageId")
		imageID, err := strconv.Atoi(imageIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid image ID"})
			return
		}

		var path string
		var isProfilePic bool
		err = db.QueryRow("SELECT path, is_profile_picture FROM user_images WHERE id = $1 AND user_id = $2", imageID, userID).Scan(&path, &isProfilePic)
		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{"error": "Image not found"})
			return
		} else if err != nil {
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		_, err = db.Exec("DELETE FROM user_images WHERE id = $1", imageID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Error deleting from database"})
			return
		}

		localPath := "." + path
		os.Remove(localPath)
		if isProfilePic {
			db.Exec("UPDATE users SET avatar_url = NULL WHERE id = $1", userID)
			var newPicID int
			var newPicPath string
			err = db.QueryRow("SELECT id, path FROM user_images WHERE user_id = $1 LIMIT 1", userID).Scan(&newPicID, &newPicPath)
			if err == nil {
				db.Exec("UPDATE user_images SET is_profile_picture = TRUE WHERE id = $1", newPicID)
				db.Exec("UPDATE users SET avatar_url = $1 WHERE id = $2", newPicPath, userID)
			}
		}

		c.JSON(200, gin.H{"message": "Image deleted"})
	}
}

func GetUserImagesHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		targetUserIDStr := c.Param("userId")
		targetUserID, err := strconv.Atoi(targetUserIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		rows, err := db.Query("SELECT id, path, is_profile_picture, created_at FROM user_images WHERE user_id = $1 ORDER BY created_at DESC", targetUserID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}
		defer rows.Close()

		images := []gin.H{}
		for rows.Next() {
			var id int
			var path string
			var isProfilePic bool
			var createdAt string
			if err := rows.Scan(&id, &path, &isProfilePic, &createdAt); err == nil {
				images = append(images, gin.H{
					"id":                 id,
					"path":               path,
					"is_profile_picture": isProfilePic,
					"created_at":         createdAt,
				})
			}
		}

		c.JSON(200, gin.H{"images": images})
	}
}

func SetProfilePictureHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}
		userID := userIDVal.(int)

		imageIDStr := c.Param("imageId")
		imageID, err := strconv.Atoi(imageIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid image ID"})
			return
		}

		var path string
		err = db.QueryRow("SELECT path FROM user_images WHERE id = $1 AND user_id = $2", imageID, userID).Scan(&path)
		if err != nil {
			c.JSON(404, gin.H{"error": "Image not found"})
			return
		}

		tx, err := db.Begin()
		if err != nil {
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		_, err = tx.Exec("UPDATE user_images SET is_profile_picture = FALSE WHERE user_id = $1", userID)
		if err != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "Error updating images"})
			return
		}

		_, err = tx.Exec("UPDATE user_images SET is_profile_picture = TRUE WHERE id = $1", imageID)
		if err != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "Error setting profile picture"})
			return
		}

		_, err = tx.Exec("UPDATE users SET avatar_url = $1 WHERE id = $2", path, userID)
		if err != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "Error updating user avatar"})
			return
		}

		tx.Commit()
		c.JSON(200, gin.H{"message": "Profile picture updated"})
	}
}
