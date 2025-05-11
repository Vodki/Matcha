package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
)

func main() {
	databaseUrl := os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		// fallback: hard-code your connection URL here if needed
		databaseUrl = "postgres://louis:matcha0402@localhost:5432/matchadb?sslmode=disable"

	}

	conn, err := pgx.Connect(context.Background(), databaseUrl)
	if err != nil {
		panic(fmt.Sprintf("Unable to connect to database: %v\n", err))
	}
	defer conn.Close(context.Background())

	fmt.Println("Connected to PostgreSQL successfully!")
}
