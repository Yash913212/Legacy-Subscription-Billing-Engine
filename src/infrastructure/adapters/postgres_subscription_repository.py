from typing import Optional
from datetime import datetime, timezone
import asyncpg
from src.domain.models.subscription import Subscription
from src.domain.ports.subscription_repository import SubscriptionRepository


class PostgresSubscriptionRepository(SubscriptionRepository):
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def get_subscription_by_user_id(self, user_id: str) -> Optional[Subscription]:
        query = "SELECT id, user_id, base_price, expires_at FROM subscriptions WHERE user_id = $1"
        row = await self.pool.fetchrow(query, user_id)
        if row:
            # Ensure expires_at is timezone aware (UTC) if it comes from DB naive
            expires_at = row["expires_at"]
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)

            return Subscription(
                id=row["id"],
                user_id=row["user_id"],
                base_price=float(row["base_price"]),
                expires_at=expires_at,
            )
        return None

    async def update_expiration(
        self, subscription_id: str, new_expiry: datetime
    ) -> None:
        query = "UPDATE subscriptions SET expires_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
        await self.pool.execute(query, new_expiry, subscription_id)
