package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type consistencyResponseWriter struct {
	gin.ResponseWriter
}

func (w *consistencyResponseWriter) WriteHeader(code int) {
	if code >= 500 && code <= 599 {
		code = http.StatusBadRequest
	}
	w.ResponseWriter.WriteHeader(code)
}

func ResponseConsistencyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer = &consistencyResponseWriter{ResponseWriter: c.Writer}
		c.Next()
	}
}
