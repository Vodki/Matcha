package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type no5xxResponseWriter struct {
	gin.ResponseWriter
}

func (w *no5xxResponseWriter) WriteHeader(code int) {
	if code >= 500 && code <= 599 {
		code = http.StatusBadRequest
	}
	w.ResponseWriter.WriteHeader(code)
}

// No5xxMiddleware ensures the API never emits a 5xx status code.
func No5xxMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer = &no5xxResponseWriter{ResponseWriter: c.Writer}
		c.Next()
	}
}
