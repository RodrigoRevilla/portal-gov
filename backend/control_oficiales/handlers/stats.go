package co_handlers

import (
	"net/http"
	"portalgov/backend/db"
	co_models "portalgov/backend/control_oficiales/models"
)

func GetStats(w http.ResponseWriter, r *http.Request) {
	var s co_models.Stats
	db.Pool.QueryRow(r.Context(), `
		SELECT
			COUNT(*) FILTER (WHERE activo),
			COUNT(*) FILTER (WHERE sid AND activo),
			COUNT(*) FILTER (WHERE internet AND activo),
			COUNT(*) FILTER (WHERE starlink AND activo),
			(SELECT COUNT(*) FROM co_oficialias),
			COUNT(*) FILTER (WHERE pendiente)
		FROM co_oficiales
	`).Scan(&s.Total, &s.SID, &s.Internet, &s.Starlink, &s.Oficialias, &s.Pendientes)
	jsonOK(w, s)
}