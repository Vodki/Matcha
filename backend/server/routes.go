package main

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine, db *sql.DB) {
	auth := router.Group("/auth")
	{
		auth.POST("/register", RegisterHandler(db))
		auth.POST("/login", LoginHandler(db))
		auth.GET("/verify", VerifyHandler(db))
	}
	protected := router.Group("/")
	protected.Use(AuthMiddleware(db))
	{
		protected.POST("/logout", LogoutHandler(db))
		protected.GET("/tags", GetUserTagsHandler(db))
		protected.POST("/tags", PostTagHandler(db))
		protected.DELETE("/tags", DeleteTagHandler(db))

		// Location endpoints
		protected.POST("/location", UpdateLocationHandler(db))
		protected.GET("/location/:userId", GetUserLocationHandler(db))
		protected.GET("/nearby", GetNearbyUsersHandler(db))
	}
}
