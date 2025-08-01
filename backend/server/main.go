package main

import (
	"matcha/database"

	"github.com/gin-gonic/gin"
)

func main() {
	db := database.DbConnect()

	defer db.Close()

	router := gin.Default()
	RegisterRoutes(router, db)
	router.Run(":8080")
}
