package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	UserID int
	Conn   *websocket.Conn
	Send   chan []byte
}

type Hub struct {
	clients    map[int]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan BroadcastMessage
	mutex      sync.RWMutex
}

type BroadcastMessage struct {
	UserID  int
	Message []byte
}

var hub = &Hub{
	clients:    make(map[int]*Client),
	register:   make(chan *Client),
	unregister: make(chan *Client),
	broadcast:  make(chan BroadcastMessage),
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client.UserID] = client
			h.mutex.Unlock()
			log.Printf("WebSocket: User %d connected", client.UserID)

			h.broadcastOnlineStatus(client.UserID, true)

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.Send)
			}
			h.mutex.Unlock()
			log.Printf("WebSocket: User %d disconnected", client.UserID)

			h.broadcastOnlineStatus(client.UserID, false)

		case msg := <-h.broadcast:
			h.mutex.RLock()
			if client, ok := h.clients[msg.UserID]; ok {
				select {
				case client.Send <- msg.Message:
				default:
					close(client.Send)
					delete(h.clients, msg.UserID)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

func (h *Hub) broadcastOnlineStatus(userID int, isOnline bool) {
	msgType := "user_offline"
	if isOnline {
		msgType = "user_online"
	}

	message := map[string]interface{}{
		"type":    msgType,
		"user_id": userID,
	}
	jsonData, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling online status message: %v", err)
		return
	}

	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for clientUserID, client := range h.clients {
		if clientUserID == userID {
			continue
		}
		select {
		case client.Send <- jsonData:
		default:
		}
	}
}

func SendToUser(userID int, message []byte) {
	hub.broadcast <- BroadcastMessage{UserID: userID, Message: message}
}

func WebSocketHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionToken := c.Query("token")
		if sessionToken == "" {
			var err error
			sessionToken, err = c.Cookie("session_token")
			if err != nil {
				log.Printf("WebSocket: No session token found (no cookie, no query param)")
				c.JSON(401, gin.H{"error": "Unauthorized"})
				return
			}
		}

		var userID int
		err := db.QueryRow("SELECT id FROM users WHERE session_token = $1", sessionToken).Scan(&userID)
		if err != nil {
			log.Printf("WebSocket: Invalid session token")
			c.JSON(401, gin.H{"error": "Invalid session"})
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

		client := &Client{
			UserID: userID,
			Conn:   conn,
			Send:   make(chan []byte, 256),
		}

		hub.register <- client

		go client.writePump()
		go client.readPump(db)
	}
}

func (c *Client) readPump(db *sql.DB) {
	defer func() {
		hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
		log.Printf("Received message from user %d: %s", c.UserID, string(message))
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func StartHub() {
	go hub.Run()
}
