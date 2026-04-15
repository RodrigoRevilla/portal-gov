package co_handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"log"

	"github.com/go-chi/chi/v5"
	"portalgov/backend/db"
	co_models "portalgov/backend/control_oficiales/models"
)

func GetOficiales(w http.ResponseWriter, r *http.Request) {
	filter  := r.URL.Query().Get("filter")
	search  := r.URL.Query().Get("search")
	ofFilt  := r.URL.Query().Get("oficialía")
	region  := r.URL.Query().Get("region")
	sistema := r.URL.Query().Get("sistema")

query := `SELECT id, nombres, ap1, ap2, username, tel, email, perfil, municipio,
                 oficialia, region, sistema, sid, internet, starlink, activo, pendiente, obs, created_at
          FROM co_oficiales WHERE 1=1`
	args := []interface{}{}
	idx  := 1

	switch filter {
	case "sid":
		query += " AND sid=true"
	case "internet":
		query += " AND internet=true"
	case "starlink":
		query += " AND starlink=true"
	case "pendientes":
		query += " AND pendiente=true"
	}

	if search != "" {
		like := "%" + search + "%"
		query += " AND (nombres||' '||ap1||' '||ap2 ILIKE $" + strconv.Itoa(idx) +
			" OR username ILIKE $" + strconv.Itoa(idx+1) +
			" OR municipio ILIKE $" + strconv.Itoa(idx+2) + ")"
		args = append(args, like, like, like)
		idx += 3
	}
	if ofFilt != "" {
		query += " AND ofic=$" + strconv.Itoa(idx)
		args = append(args, ofFilt)
		idx++
	}
	if region != "" {
		query += " AND region=$" + strconv.Itoa(idx)
		args = append(args, region)
		idx++
	}
	if sistema != "" {
		query += " AND sistema=$" + strconv.Itoa(idx)
		args = append(args, sistema)
	}

	query += " ORDER BY pendiente DESC, oficialia, ap1, nombres"

rows, err := db.Pool.Query(r.Context(), query, args...)
if err != nil {
    log.Printf("ERROR query oficiales: %v", err)
    jsonErr(w, http.StatusInternalServerError, err.Error())
    return
}
defer rows.Close()

oficiales := []co_models.Oficial{}
for rows.Next() {
    var o co_models.Oficial
    err := rows.Scan(
        &o.ID, &o.Nombres, &o.Ap1, &o.Ap2, &o.Username, &o.Tel, &o.Email,
        &o.Perfil, &o.Municipio, &o.Oficialia, &o.Region, &o.Sistema,
        &o.SID, &o.Internet, &o.Starlink, &o.Activo, &o.Pendiente, &o.Obs, &o.CreatedAt,
    )
    if err != nil {
        log.Printf("ERROR scan oficial: %v", err)
        continue
    }
    oficiales = append(oficiales, o)
}
	jsonOK(w, oficiales)
}

func CreateOficial(w http.ResponseWriter, r *http.Request) {
	var o co_models.Oficial
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		jsonErr(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	if strings.TrimSpace(o.Nombres) == "" || strings.TrimSpace(o.Ap1) == "" {
		jsonErr(w, http.StatusBadRequest, "Nombre y apellido paterno son obligatorios")
		return
	}
	err := db.Pool.QueryRow(r.Context(), `
		INSERT INTO co_oficiales
		(nombres,ap1,ap2,username,tel,email,perfil,municipio,oficialia,region,sistema,
		 sid,internet,starlink,activo,pendiente,obs)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
		RETURNING id`,
		o.Nombres, o.Ap1, o.Ap2, o.Username, o.Tel, o.Email, o.Perfil, o.Municipio,
		o.Oficialia, o.Region, o.Sistema,
		o.SID, o.Internet, o.Starlink, o.Activo, o.Pendiente, o.Obs,
	).Scan(&o.ID)
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonOK(w, o)
}

func UpdateOficial(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		jsonErr(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var o co_models.Oficial
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		jsonErr(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	if strings.TrimSpace(o.Nombres) == "" || strings.TrimSpace(o.Ap1) == "" {
		jsonErr(w, http.StatusBadRequest, "Nombre y apellido paterno son obligatorios")
		return
	}
	_, err = db.Pool.Exec(r.Context(), `
		UPDATE co_oficiales
		SET nombres=$1,ap1=$2,ap2=$3,username=$4,tel=$5,email=$6,perfil=$7,municipio=$8,
		    oficialia=$9,region=$10,sistema=$11,sid=$12,internet=$13,starlink=$14,
		    activo=$15,pendiente=$16,obs=$17
		WHERE id=$18`,
		o.Nombres, o.Ap1, o.Ap2, o.Username, o.Tel, o.Email, o.Perfil, o.Municipio,
		o.Oficialia, o.Region, o.Sistema,
		o.SID, o.Internet, o.Starlink, o.Activo, o.Pendiente, o.Obs, id,
	)
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	o.ID = id
	jsonOK(w, o)
}

func DeleteOficial(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		jsonErr(w, http.StatusBadRequest, "ID inválido")
		return
	}
	_, err = db.Pool.Exec(r.Context(), "DELETE FROM co_oficiales WHERE id=$1", id)
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonOK(w, map[string]int{"deleted_id": id})
}