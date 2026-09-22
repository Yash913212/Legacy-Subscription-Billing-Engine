from abc import ABC, abstractmethod
from datetime import datetime


class TimeProvider(ABC):
    @abstractmethod
    def get_current_time(self) -> datetime:
        pass
