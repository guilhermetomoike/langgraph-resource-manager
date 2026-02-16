"""
FastAPI Application - REST API for LangGraph Service

Simple starter API to get the server running.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="LangGraph Resource Manager",
    description="Multi-agent system for construction resource management",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "healthy",
        "service": "LangGraph Resource Manager",
        "version": "1.0.0",
        "message": "Server is running successfully!"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


# Startup/Shutdown events
@app.on_event("startup")
async def startup_event():
    """Inicialização do serviço"""
    logger.info("[API] LangGraph Resource Manager starting up...")


@app.on_event("shutdown")
async def shutdown_event():
    """Encerramento do serviço"""
    logger.info("[API] LangGraph Resource Manager shutting down...")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
