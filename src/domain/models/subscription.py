from dataclasses import dataclass
from datetime import datetime


@dataclass
class Subscription:
    id: str
    user_id: str
    base_price: float
    expires_at: datetime
