package server

import (
	// "github.com/gorilla/websocket"

	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var Allrooms RoomMap

func CreateRoomRequestHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	roomID := Allrooms.createRoom()
	type resp struct {
		RoomID string `json:"room_id"`
	}
	json.NewEncoder(w).Encode(resp{RoomID: roomID})
}

var upgrader = websocket.Upgrader{
	//for cors
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type broadcastMsg struct {
	Message map[string]interface{}
	RoomID  string
	client  *websocket.Conn
}

var broadcastChannel = make(chan broadcastMsg)

func broadcaster() {
	for {
		msg := <-broadcastChannel

		for _, client := range Allrooms.Map[msg.RoomID] {
			if client.conn != msg.client {
				err := client.conn.WriteJSON(msg.Message)
				if err != nil {
					log.Fatal(err)
					client.conn.Close()
				}
			}
		}
	}
}

func JoinRoomHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	roomID, ok := r.URL.Query()["roomID"]
	if !ok {
		log.Println("missing url parameter roomID")
		return
	}
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal("we socket upgrade failed", err)
	}
	Allrooms.InsertIntoRoom(roomID[0], false, ws)
	go broadcaster()

	for {
		var msg broadcastMsg
		err := ws.ReadJSON(&msg.Message)
		if err != nil {
			log.Fatal("READ ERROR ", err)
		}
		msg.RoomID = roomID[0]
		broadcastChannel <- msg
	}
}
