package main

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        cookie, err := c.Cookie("session_token")
        if err != nil {
            c.JSON(401, gin.H{"error": "Unauthorized"})
            c.Abort()
            return
        }

        var userID int
        err = db.QueryRow("SELECT id FROM users WHERE session_token = $1", cookie).Scan(&userID)
        if err != nil {
            c.JSON(401, gin.H{"error": "Unauthorized"})
            c.Abort()
            return
        }

        c.Set("userID", userID)
        c.Next()
    }
}