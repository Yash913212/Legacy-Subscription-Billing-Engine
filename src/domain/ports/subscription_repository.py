from abc import ABC, abstractmethod
from typing import Optional
from datetime import datetime
from src.domain.models.subscription import Subscription


class SubscriptionRepository(ABC):
    @abstractmethod
    async def get_subscription_by_user_id(self, user_id: str) -> Optional[Subscription]:
        pass

    @abstractmethod
    async def update_expiration(
        self, subscription_id: str, new_expiry: datetime
    ) -> None:
        pass
