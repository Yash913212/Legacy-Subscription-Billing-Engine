from abc import ABC, abstractmethod
from typing import Optional
from src.domain.models.user import User


class UserRepository(ABC):
    @abstractmethod
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        pass
