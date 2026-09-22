import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncpg
from dotenv import load_dotenv

from src.api.routers import renewal_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        # Fallback for docker-compose default if not set
        database_url = "postgresql://postgres:postgres@db:5432/postgres"

    app.state.pool = await asyncpg.create_pool(database_url)

    yield

    # Shutdown: Close DB pool
    await app.state.pool.close()


app = FastAPI(lifespan=lifespan)

app.include_router(renewal_router.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 3000))
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=port, reload=True)
