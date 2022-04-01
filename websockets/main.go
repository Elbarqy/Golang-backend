package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func setUpRoutes() {
	http.HandleFunc("/", homePage)
	http.HandleFunc("/ws", wsEndPoint)
}

func homePage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "home page")
}

func reader(conn *websocket.Conn) {
	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}
		log.Println(string(p))
		if err := conn.WriteMessage(messageType, p); err != nil {
			log.Println(err)
			return
		}
	}
}

func wsEndPoint(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}
	log.Println("Client connected successfuly ")
	reader(ws)
}
func main() {
	setUpRoutes()
	fmt.Println("works")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
