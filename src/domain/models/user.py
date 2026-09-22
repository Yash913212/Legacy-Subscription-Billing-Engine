from dataclasses import dataclass


@dataclass
class User:
    id: str
    stripe_customer_id: str
