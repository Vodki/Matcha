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

		// Password reset endpoints (public)
		auth.POST("/request-reset", RequestPasswordResetHandler(db))
		auth.POST("/reset-password", ResetPasswordHandler(db))
	}
	protected := router.Group("/")
	protected.Use(AuthMiddleware(db))
	{
		protected.POST("/logout", LogoutHandler(db))

		// User endpoints
		protected.GET("/me", GetCurrentUserHandler(db))
		protected.GET("/users", GetAllUsersHandler(db))
		protected.GET("/user/:userId", GetUserByIdHandler(db))

		protected.GET("/tags", GetUserTagsHandler(db))
		protected.POST("/tags", PostTagHandler(db))
		protected.DELETE("/tags", DeleteTagHandler(db))

		// Location endpoints
		protected.POST("/location", UpdateLocationHandler(db))
		protected.GET("/location/:userId", GetUserLocationHandler(db))
		protected.GET("/nearby", GetNearbyUsersHandler(db))

		// Fame rating endpoints
		protected.POST("/profile/:userId/view", RecordProfileViewHandler(db))
		protected.POST("/profile/:userId/like", ToggleProfileLikeHandler(db))
		protected.GET("/profile/:userId/stats", GetProfileStatsHandler(db))
		protected.GET("/profile/:userId/like-status", CheckLikeStatusHandler(db))
	}
}
