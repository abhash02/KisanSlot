from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    database: str
    database_error: Optional[str] = None

