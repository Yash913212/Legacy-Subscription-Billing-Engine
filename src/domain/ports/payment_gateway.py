from abc import ABC, abstractmethod


class PaymentGateway(ABC):
    @abstractmethod
    async def charge(self, customer_id: str, amount: float) -> bool:
        pass
