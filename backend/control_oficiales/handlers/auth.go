package co_handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"portalgov/backend/db"
	mw "portalgov/backend/middleware"
)

func Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Usuario  string `json:"usuario"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonErr(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	var id int
	err := db.Pool.QueryRow(r.Context(),
		"SELECT id FROM co_usuarios WHERE usuario=$1 AND password=$2",
		req.Usuario, req.Password,
	).Scan(&id)
	if err != nil {
		jsonErr(w, http.StatusUnauthorized, "Usuario o contraseña incorrectos")
		return
	}
	token, err := mw.GenerarToken(strings.ToLower(req.Usuario), "", "admin")
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, "Error generando token")
		return
	}
	jsonOK(w, map[string]string{
		"token":   token,
		"usuario": req.Usuario,
	})
}

func ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Actual string `json:"actual"`
		Nueva  string `json:"nueva"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonErr(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	if strings.TrimSpace(req.Nueva) == "" || len(req.Nueva) < 6 {
		jsonErr(w, http.StatusBadRequest, "La contraseña debe tener al menos 6 caracteres")
		return
	}
	var id int
	err := db.Pool.QueryRow(r.Context(),
		"SELECT id FROM co_usuarios WHERE password=$1", req.Actual,
	).Scan(&id)
	if err != nil {
		jsonErr(w, http.StatusUnauthorized, "La contraseña actual es incorrecta")
		return
	}
	_, err = db.Pool.Exec(r.Context(),
		"UPDATE co_usuarios SET password=$1 WHERE id=$2", req.Nueva, id)
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonOK(w, map[string]string{"message": "Contraseña actualizada"})
}