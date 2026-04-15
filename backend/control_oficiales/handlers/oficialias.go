package co_handlers

import (
	"encoding/json"
	"net/http"

	"portalgov/backend/db"
	co_models "portalgov/backend/control_oficiales/models"
)

func GetOficialias(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Pool.Query(r.Context(),
		"SELECT id, numero, nombre, region, sistema, listo_sid FROM co_oficialias ORDER BY nombre")
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	list := []co_models.Oficialia{}
	for rows.Next() {
		var o co_models.Oficialia
		rows.Scan(&o.ID, &o.Numero, &o.Nombre, &o.Region, &o.Sistema, &o.ListoSid)
		list = append(list, o)
	}
	jsonOK(w, list)
}

func CreateOficialia(w http.ResponseWriter, r *http.Request) {
	var o co_models.Oficialia
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		jsonErr(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	err := db.Pool.QueryRow(r.Context(), `
		INSERT INTO co_oficialias (numero, nombre, region, sistema, listo_sid)
		VALUES ($1,$2,$3,$4,$5) RETURNING id`,
		o.Numero, o.Nombre, o.Region, o.Sistema, o.ListoSid,
	).Scan(&o.ID)
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonOK(w, o)
}

func UpdateOficialia(w http.ResponseWriter, r *http.Request) {
	var o co_models.Oficialia
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		jsonErr(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	_, err := db.Pool.Exec(r.Context(), `
		UPDATE co_oficialias SET numero=$1, nombre=$2, region=$3, sistema=$4, listo_sid=$5
		WHERE id=$6`,
		o.Numero, o.Nombre, o.Region, o.Sistema, o.ListoSid, o.ID,
	)
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonOK(w, o)
}