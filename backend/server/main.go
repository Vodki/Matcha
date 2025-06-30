package main

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

//import (
//	"Matcha/database"
//)

func main() {

	connStr := "postgres://postgres:secret@localhost:5432/matcha?sslmode=disable"

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatal(err)
	}

}
