package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func health(w http.ResponseWriter, _ *http.Request) {
	json.NewEncoder(w).Encode(&Message{Message: "ok"})
}

func helloWorld(w http.ResponseWriter, _ *http.Request) {
	fmt.Fprint(w, "Hello, world!")
}
