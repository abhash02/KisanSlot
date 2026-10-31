from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

from typing import Generator
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("kisanslot.db")

# In development or testing, fail fast if DB server is offline rather than hanging
connect_args = {}
db_url = settings.DATABASE_URL

if "postgresql" in db_url:
    connect_args["connect_timeout"] = 2
    try:
        temp_engine = create_engine(
            db_url,
            echo=False,
            pool_pre_ping=True,
            connect_args=connect_args,
        )
        with temp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = temp_engine
    except Exception as exc:
        logger.warning(
            f"PostgreSQL connection to {db_url} failed ({exc}). "
            "Falling back to local SQLite database (kisanslot.db) so you can preview and test the app immediately."
        )
        db_url = "sqlite:///./kisanslot.db"
        connect_args = {"check_same_thread": False}
        engine = create_engine(db_url, echo=False, connect_args=connect_args)
        import app.models  # Register all models with Base.metadata
        from app.db.base import Base
        Base.metadata.create_all(bind=engine)
elif "sqlite" in db_url:
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, echo=False, connect_args=connect_args)
    import app.models  # Register all models with Base.metadata
    from app.db.base import Base
    Base.metadata.create_all(bind=engine)
else:
    engine = create_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        connect_args=connect_args,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
