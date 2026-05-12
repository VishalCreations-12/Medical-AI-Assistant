package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/medical-ai-assistant/backend/config"
	"github.com/medical-ai-assistant/backend/handlers"
	"github.com/medical-ai-assistant/backend/middleware"
	"github.com/medical-ai-assistant/backend/models"
	"github.com/medical-ai-assistant/backend/repositories/memory"
	"github.com/medical-ai-assistant/backend/services"
)

func Setup(cfg *config.Config, store *memory.Store) *gin.Engine {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	userRepo := memory.UserRepo{S: store}
	catRepo := memory.CategoryRepo{S: store}
	prodRepo := memory.ProductRepo{S: store}
	supRepo := memory.SupplierRepo{S: store}
	poRepo := memory.PurchaseOrderRepo{S: store}
	stockRepo := memory.StockRepo{S: store}

	authSvc := &services.AuthService{Users: userRepo, JWTSecret: cfg.JWTSecret}
	authH := &handlers.AuthHandler{Svc: authSvc}

	dashSvc := &services.DashboardService{Products: prodRepo, Orders: poRepo, Categories: catRepo}
	dashH := &handlers.DashboardHandler{Svc: dashSvc}

	insSvc := &services.InsightsService{Products: prodRepo, Stock: stockRepo, Categories: catRepo}
	insH := &handlers.InsightsHandler{Svc: insSvc}

	prodH := &handlers.ProductHandler{Products: prodRepo, Stock: stockRepo}
	catH := &handlers.CategoryHandler{Categories: catRepo}
	supH := &handlers.SupplierHandler{Suppliers: supRepo}
	poH := &handlers.PurchaseOrderHandler{Orders: poRepo, Suppliers: supRepo, Products: prodRepo}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	v1 := r.Group("/api/v1")

	v1.POST("/auth/register", authH.Register)
	v1.POST("/auth/login", authH.Login)

	authz := v1.Group("")
	authz.Use(middleware.JWTAuth(cfg))
	authz.GET("/auth/me", authH.Me)
	authz.POST("/auth/logout", authH.Logout)

	authz.GET("/dashboard/summary", dashH.Summary)
	authz.GET("/insights", insH.Get)

	authz.GET("/products", prodH.List)
	authz.GET("/products/:id", prodH.Get)
	write := authz.Group("")
	write.Use(middleware.RequireRoles(models.RoleAdmin, models.RoleManager))
	write.POST("/products", prodH.Create)
	write.PUT("/products/:id", prodH.Update)
	write.DELETE("/products/:id", prodH.Delete)

	authz.GET("/categories", catH.List)
	write.POST("/categories", catH.Create)
	write.PUT("/categories/:id", catH.Update)
	write.DELETE("/categories/:id", catH.Delete)

	authz.GET("/suppliers", supH.List)
	write.POST("/suppliers", supH.Create)
	write.PUT("/suppliers/:id", supH.Update)
	write.DELETE("/suppliers/:id", supH.Delete)

	authz.GET("/purchase-orders", poH.List)
	authz.GET("/purchase-orders/:id", poH.Get)
	write.POST("/purchase-orders", poH.Create)
	write.PUT("/purchase-orders/:id", poH.Update)
	write.DELETE("/purchase-orders/:id", poH.Delete)

	return r
}
