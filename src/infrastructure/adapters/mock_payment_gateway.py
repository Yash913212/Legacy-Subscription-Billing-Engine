from src.domain.ports.payment_gateway import PaymentGateway
import asyncio
import logging

logger = logging.getLogger(__name__)


class MockPaymentGateway(PaymentGateway):
    async def charge(self, customer_id: str, amount: float) -> bool:
        # Simulate network latency
        await asyncio.sleep(0.5)

        logger.info(f"Simulating charge of ${amount} to customer {customer_id}")

        # Simulate a successful charge most of the time
        return True
