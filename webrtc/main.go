package main

import (
	"chat-room/server"
	"log"
	"net/http"
)

func main() {
	server.Allrooms.Init()
	http.HandleFunc("/create", server.CreateRoomRequestHandler)
	http.HandleFunc("/join", server.JoinRoomHandler)

	log.Println("Starting Server on port 8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
