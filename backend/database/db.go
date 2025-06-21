package database

// Package database initializes the database connection and creates the necessary tables.
// It uses the PostgreSQL driver and requires the DATABASE_URL environment variable to be set.
// The initDB function connects to the database and creates a users table if it doesn't exist.
// It also handles errors during the connection and table creation process.
// The DB variable is exported for use in other packages.
// It is important to set the DATABASE_URL environment variable before running the application.

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	dsn := os.Getenv("DATABASE_URL")
	fmt.Printf("Connecting to database with DSN: %s\n", dsn)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}
	DB = db

	// Create table if it doesn't exist
	schema := `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
    );`
	if _, err := db.Exec(schema); err != nil {
		log.Fatal("Failed to create users table:", err)
	}
	log.Println("Database initialized and users table created successfully.")
}
