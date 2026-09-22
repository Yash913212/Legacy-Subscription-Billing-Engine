from typing import Optional
import asyncpg
from src.domain.models.user import User
from src.domain.ports.user_repository import UserRepository


class PostgresUserRepository(UserRepository):
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        query = "SELECT id, stripe_customer_id FROM users WHERE id = $1"
        row = await self.pool.fetchrow(query, user_id)
        if row:
            return User(id=row["id"], stripe_customer_id=row["stripe_customer_id"])
        return None
