package middleware

import (
	"log"
	"net/http"
	"strings"
)

func Logging(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		client := r.RemoteAddr
		forwardedFor := r.Header.Get("X-Forwarded-For")

		if forwardedFor != "" {
			client = strings.Split(forwardedFor, ", ")[0]
			forwardedFor = strings.ReplaceAll(forwardedFor, " ", "")
		} else {
			forwardedFor = "-"
		}

		log.Printf("%s %s (%s) %s %s", r.RemoteAddr, client, forwardedFor, r.Method, r.URL)

		h.ServeHTTP(w, r)
	})
}
