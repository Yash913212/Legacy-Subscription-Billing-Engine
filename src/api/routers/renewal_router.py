from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import asyncpg
from typing import Dict, Any

from src.domain.services.subscription_billing_service import SubscriptionBillingService
from src.infrastructure.adapters.postgres_subscription_repository import (
    PostgresSubscriptionRepository,
)
from src.infrastructure.adapters.postgres_user_repository import PostgresUserRepository
from src.infrastructure.adapters.mock_payment_gateway import MockPaymentGateway
from src.infrastructure.adapters.system_time_provider import SystemTimeProvider

router = APIRouter()


class RenewalRequest(BaseModel):
    userId: str


async def get_db_pool(request: Request) -> asyncpg.Pool:
    return request.app.state.pool


@router.post("/renew")
async def renew_subscription(
    req: RenewalRequest, pool: asyncpg.Pool = Depends(get_db_pool)
):
    try:
        # Wire up dependencies
        subscription_repo = PostgresSubscriptionRepository(pool)
        user_repo = PostgresUserRepository(pool)
        payment_gateway = MockPaymentGateway()
        time_provider = SystemTimeProvider()

        service = SubscriptionBillingService(
            subscription_repo=subscription_repo,
            user_repo=user_repo,
            payment_gateway=payment_gateway,
            time_provider=time_provider,
        )

        result = await service.process_renewal(req.userId)

        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])

    except HTTPException:
        raise
    except Exception as e:
        import logging

        logging.error(f"Error processing renewal: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
