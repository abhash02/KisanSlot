import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("kisanslot")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup check
    logger.info(f"Starting {settings.APP_NAME} in [{settings.ENVIRONMENT}] mode...")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to PostgreSQL database.")
    except Exception as exc:
        logger.warning(
            "========================================================================\n"
            "WARNING: Could not connect to PostgreSQL database!\n"
            f"Details: {exc}\n"
            "If running locally, ensure PostgreSQL is started via Docker Compose:\n"
            "    docker compose up -d\n"
            "Or start your local PostgreSQL service and verify DATABASE_URL in .env\n"
            "========================================================================"
        )
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title="KisanSlot API",
    description="Farmer Procurement Scheduling API (SIH26032)",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "name": settings.APP_NAME,
        "description": "Farmer Procurement Scheduling API (Prototype)",
        "version": "0.1.0",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }

