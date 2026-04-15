package main

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine, db *sql.DB) {
	StartHub(db)

	router.GET("/ws", WebSocketHandler(db))

	auth := router.Group("/auth")
	{
		auth.POST("/register", RegisterHandler(db))
		auth.POST("/login", LoginHandler(db))
		auth.GET("/verify", VerifyHandler(db))

		auth.POST("/request-reset", RequestPasswordResetHandler(db))
		auth.POST("/reset-password", ResetPasswordHandler(db))
	}
	protected := router.Group("/")
	protected.Use(AuthMiddleware(db))
	{
		protected.POST("/logout", LogoutHandler(db))

		protected.GET("/me", GetCurrentUserHandler(db))
		protected.GET("/users", GetAllUsersHandler(db))
		protected.GET("/suggestions", GetSuggestionsHandler(db))
		protected.GET("/user/:userId", GetUserByIdHandler(db))

		protected.GET("/tags", GetUserTagsHandler(db))
		protected.POST("/tags", PostTagHandler(db))
		protected.DELETE("/tags", DeleteTagHandler(db))

		protected.POST("/location", UpdateLocationHandler(db))
		protected.GET("/location/:userId", GetUserLocationHandler(db))
		protected.GET("/nearby", GetNearbyUsersHandler(db))
		protected.POST("/profile/:userId/view", RecordProfileViewHandler(db))
		protected.POST("/profile/:userId/like", ToggleProfileLikeHandler(db))
		protected.GET("/profile/:userId/stats", GetProfileStatsHandler(db))
		protected.GET("/profile/:userId/like-status", CheckLikeStatusHandler(db))
		protected.GET("/profile/:userId/viewers", GetProfileViewersHandler(db))
		protected.GET("/profile/:userId/likers", GetProfileLikersHandler(db))

		protected.PUT("/profile/update", UpdateProfileHandler(db))
		protected.PUT("/profile/email", UpdateEmailHandler(db))
		protected.PUT("/profile/tags", UpdateTagsHandler(db))
		protected.POST("/chat/message", SendMessageHandler(db))
		protected.GET("/chat/history/:userId", GetChatHistoryHandler(db))
		protected.GET("/chat/conversations", GetConversationsHandler(db))

		protected.GET("/notifications", GetNotificationsHandler(db))
		protected.POST("/notifications/:id/read", MarkNotificationReadHandler(db))

		protected.POST("/user/:userId/block", BlockUserHandler(db))
		protected.DELETE("/user/:userId/block", UnblockUserHandler(db))
		protected.GET("/user/blocked", GetBlockedUsersHandler(db))
		protected.POST("/user/:userId/report", ReportUserHandler(db))

		protected.POST("/profile/image", UploadImageHandler(db))
		protected.DELETE("/profile/image/:imageId", DeleteImageHandler(db))
		protected.GET("/user/:userId/images", GetUserImagesHandler(db))
		protected.POST("/profile/image/:imageId/set-profile", SetProfilePictureHandler(db))
	}
}
