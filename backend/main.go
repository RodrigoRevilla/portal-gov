package main

import (
	"log"
	"net/http"

	"portalgov/backend/config"
	"portalgov/backend/db"
	invHandlers "portalgov/backend/handlers"
	coHandlers "portalgov/backend/control_oficiales/handlers"
	mw "portalgov/backend/middleware"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

func main() {
	cfg := config.Load()

	if err := db.Connect(cfg.DBUrl); err != nil {
		log.Fatalf("Error conectando a DB: %v", err)
	}
	defer db.Close()

	mw.SetJWTSecret(cfg.JWTSecret)

	r := chi.NewRouter()

	r.Use(chimw.Recoverer)
	r.Use(mw.Logger)
r.Use(func(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Max-Age", "86400")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        next.ServeHTTP(w, r)
    })
})
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"ok":true,"service":"portal-gov-api"}`))
	})

	r.Post("/api/v1/auth/login", invHandlers.Login)

	r.Group(func(r chi.Router) {
		r.Use(mw.Auth)
		r.Patch("/api/v1/auth/password", invHandlers.CambiarPasswordPropio)
		r.With(mw.RequiereRol("admin")).Post("/api/v1/usuarios", invHandlers.CrearUsuario)
		r.With(mw.RequiereRol("admin")).Get("/api/v1/usuarios", invHandlers.ListarUsuarios)
		r.With(mw.RequiereRol("admin")).Post("/api/v1/catalogo/importar", invHandlers.ImportarCatalogo)
		r.Get("/api/v1/catalogo", invHandlers.ListarCatalogo)
		r.With(mw.RequiereRol("supervisor", "admin")).Post("/api/v1/sesiones", invHandlers.CrearSesion)
		r.Get("/api/v1/sesiones", invHandlers.ListarSesiones)
		r.Get("/api/v1/sesiones/{id}", invHandlers.ObtenerSesion)
		r.With(mw.RequiereRol("supervisor", "admin")).Patch("/api/v1/sesiones/{id}/pausar", invHandlers.PausarSesion)
		r.With(mw.RequiereRol("supervisor", "admin")).Patch("/api/v1/sesiones/{id}/reanudar", invHandlers.ReanudarSesion)
		r.With(mw.RequiereRol("supervisor", "admin")).Post("/api/v1/sesiones/{id}/cerrar", invHandlers.CerrarSesion)
		r.Get("/api/v1/sesiones/{id}/faltantes", invHandlers.ListarFaltantes)
		r.With(mw.RequiereRol("escaner", "supervisor", "admin")).Post("/api/v1/escaneos", invHandlers.RegistrarEscaneo)
		r.Get("/api/v1/escaneos", invHandlers.ListarEscaneos)
		r.With(mw.RequiereRol("admin")).Patch("/api/v1/usuarios/{id}/toggle", invHandlers.ToggleUsuario)
		r.With(mw.RequiereRol("admin")).Patch("/api/v1/usuarios/{id}/password", invHandlers.ResetPassword)
		r.With(mw.RequiereRol("admin", "auditor")).Get("/api/v1/audit-log", invHandlers.ListarAuditLog)
	})

	r.Post("/api/co/login", coHandlers.Login)

	r.Group(func(r chi.Router) {
		r.Use(mw.Auth)
		r.Put("/api/co/password", coHandlers.ChangePassword)
		r.Get("/api/co/stats", coHandlers.GetStats)
		r.Get("/api/co/oficialias", coHandlers.GetOficialias)
		r.Post("/api/co/oficialias", coHandlers.CreateOficialia)
		r.Put("/api/co/oficialias", coHandlers.UpdateOficialia)
		r.Get("/api/co/oficiales", coHandlers.GetOficiales)
		r.Post("/api/co/oficiales", coHandlers.CreateOficial)
		r.Put("/api/co/oficiales/{id}", coHandlers.UpdateOficial)
		r.Delete("/api/co/oficiales/{id}", coHandlers.DeleteOficial)
	})

	log.Printf("✓ Portal Gov API corriendo en http://localhost:%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, r))
}