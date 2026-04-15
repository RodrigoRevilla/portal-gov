package co_models

import "time"

type Oficial struct {
	ID        int       `json:"id"`
	Nombres   string    `json:"nombres"`
	Ap1       string    `json:"ap1"`
	Ap2       string    `json:"ap2"`
	Username  string    `json:"username"`
	Tel       string    `json:"tel"`
	Email     string    `json:"email"`
	Perfil    string    `json:"perfil"`
	Municipio string    `json:"municipio"`
	Oficialia int       `json:"ofic"`
	Region    string    `json:"region"`
	Sistema   string    `json:"sistema"`
	SID       bool      `json:"sid"`
	Internet  bool      `json:"internet"`
	Starlink  bool      `json:"starlink"`
	Activo    bool      `json:"activo"`
	Pendiente bool      `json:"pendiente"`
	Obs       string    `json:"obs"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}

type Oficialia struct {
	ID       int    `json:"id"`
	Numero   string `json:"numero"`
	Nombre   string `json:"nombre"`
	Region   string `json:"region"`
	Sistema  string `json:"sistema"`
	ListoSid bool   `json:"listo_sid"`
}

type Stats struct {
	Total      int `json:"total"`
	SID        int `json:"sid"`
	Internet   int `json:"internet"`
	Starlink   int `json:"starlink"`
	Oficialias int `json:"oficialias"`
	Pendientes int `json:"pendientes"`
}