from datetime import datetime, timezone
from src.domain.ports.time_provider import TimeProvider


class SystemTimeProvider(TimeProvider):
    def get_current_time(self) -> datetime:
        # Use UTC for consistency
        return datetime.now(timezone.utc)
