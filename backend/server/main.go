package main

import (
	"matcha/database"

	"github.com/gin-gonic/gin"
)

func main() {
	db := database.DbConnect()

	defer db.Close()

	router := gin.Default()
	router.POST("/register", func(c *gin.Context) {
		registerHandler(c, db)
	})
	router.POST("/login", func(c *gin.Context) {
		loginHandler(c, db)
	})
	router.Run(":8080")
}
