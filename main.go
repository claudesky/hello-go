package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/claudesky/hello-go/middleware"
)

var addr = flag.String("addr", ":9101", "Http Service Address")

type Message struct {
	Message string `json:"message"`
}

func main() {
	flag.Parse()

	hub := newHub()
	go hub.run()

	httpStack := middleware.Logging(http.HandlerFunc(httpHandler))
	wsStack := middleware.Logging(
		http.HandlerFunc(
			func(w http.ResponseWriter, r *http.Request) {
				websocketsHandler(hub, w, r)
			},
		),
	)
	mux := http.NewServeMux()
	mux.Handle("/ws", wsStack)
	mux.Handle("/", httpStack)
	log.Fatal((http.ListenAndServe(*addr, mux)))
}

func httpHandler(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/hello-world":
		helloWorld(w, r)
	case "/healthcheck":
		health(w, r)
	default:
		http.Error(w, "Not Found.", http.StatusNotFound)
	}
}

func websocketsHandler(hub *Hub, w http.ResponseWriter, r *http.Request) {
	serveWs(hub, w, r)
}
