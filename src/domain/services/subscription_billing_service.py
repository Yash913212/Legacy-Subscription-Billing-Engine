import logging

from dateutil.relativedelta import relativedelta
from typing import Dict, Any

from src.domain.ports.subscription_repository import SubscriptionRepository
from src.domain.ports.user_repository import UserRepository
from src.domain.ports.payment_gateway import PaymentGateway
from src.domain.ports.time_provider import TimeProvider

logger = logging.getLogger(__name__)


class SubscriptionBillingService:
    def __init__(
        self,
        subscription_repo: SubscriptionRepository,
        user_repo: UserRepository,
        payment_gateway: PaymentGateway,
        time_provider: TimeProvider,
    ):
        self.subscription_repo = subscription_repo
        self.user_repo = user_repo
        self.payment_gateway = payment_gateway
        self.time_provider = time_provider

    async def process_renewal(self, user_id: str) -> Dict[str, Any]:
        user = await self.user_repo.get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "User not found"}

        sub = await self.subscription_repo.get_subscription_by_user_id(user_id)
        if not sub:
            return {"success": False, "message": "Subscription not found"}

        now = self.time_provider.get_current_time()

        # Business Rule 1: Cannot renew if not expired
        # Ensure we are comparing timezone-aware datetimes if applicable, assuming UTC
        if sub.expires_at > now:
            return {"success": False, "message": "Subscription is not yet expired"}

        charge_amount = float(sub.base_price)

        # Business Rule 2: December Promotional Discount (10% off)
        # In Python datetime, month 12 is December
        if now.month == 12:
            charge_amount = charge_amount * 0.9

        try:
            charge_success = await self.payment_gateway.charge(
                user.stripe_customer_id, charge_amount
            )

            if charge_success:
                # Business Rule 3: Add exactly 1 year to current time for next expiry
                new_expiry = now + relativedelta(years=1)

                await self.subscription_repo.update_expiration(sub.id, new_expiry)
                return {"success": True, "message": "Renewal successful"}
            else:
                return {"success": False, "message": "Payment failed"}
        except Exception as e:
            logger.error(f"Payment gateway error: {e}")
            return {"success": False, "message": "Payment gateway error"}
