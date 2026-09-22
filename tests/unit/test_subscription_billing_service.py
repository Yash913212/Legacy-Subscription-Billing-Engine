import pytest
from unittest.mock import AsyncMock, Mock
from datetime import datetime, timezone
from src.domain.services.subscription_billing_service import SubscriptionBillingService
from src.domain.models.user import User
from src.domain.models.subscription import Subscription


@pytest.fixture
def mock_sub_repo():
    return AsyncMock()


@pytest.fixture
def mock_user_repo():
    return AsyncMock()


@pytest.fixture
def mock_payment_gateway():
    return AsyncMock()


@pytest.fixture
def mock_time_provider():
    return Mock()


@pytest.fixture
def service(mock_sub_repo, mock_user_repo, mock_payment_gateway, mock_time_provider):
    return SubscriptionBillingService(
        mock_sub_repo, mock_user_repo, mock_payment_gateway, mock_time_provider
    )


@pytest.fixture
def mock_user():
    return User(id="user-123", stripe_customer_id="stripe-123")


@pytest.mark.asyncio
async def test_fails_if_user_not_found(service, mock_user_repo, mock_payment_gateway):
    mock_user_repo.get_user_by_id.return_value = None

    result = await service.process_renewal("non-existent")

    assert result["success"] is False
    assert result["message"] == "User not found"
    mock_payment_gateway.charge.assert_not_called()


@pytest.mark.asyncio
async def test_fails_if_subscription_not_found(
    service, mock_user_repo, mock_sub_repo, mock_user, mock_payment_gateway
):
    mock_user_repo.get_user_by_id.return_value = mock_user
    mock_sub_repo.get_subscription_by_user_id.return_value = None

    result = await service.process_renewal("user-123")

    assert result["success"] is False
    assert result["message"] == "Subscription not found"
    mock_payment_gateway.charge.assert_not_called()


@pytest.mark.asyncio
async def test_fails_if_not_expired(
    service,
    mock_user_repo,
    mock_sub_repo,
    mock_time_provider,
    mock_user,
    mock_payment_gateway,
):
    mock_user_repo.get_user_by_id.return_value = mock_user
    mock_time_provider.get_current_time.return_value = datetime(
        2023, 1, 1, tzinfo=timezone.utc
    )

    # Expires in the future
    mock_sub = Subscription(
        "sub-123", "user-123", 100.0, datetime(2023, 2, 1, tzinfo=timezone.utc)
    )
    mock_sub_repo.get_subscription_by_user_id.return_value = mock_sub

    result = await service.process_renewal("user-123")

    assert result["success"] is False
    assert result["message"] == "Subscription is not yet expired"
    mock_payment_gateway.charge.assert_not_called()


@pytest.mark.asyncio
async def test_fails_if_payment_gateway_fails(
    service,
    mock_user_repo,
    mock_sub_repo,
    mock_time_provider,
    mock_payment_gateway,
    mock_user,
):
    mock_user_repo.get_user_by_id.return_value = mock_user
    mock_time_provider.get_current_time.return_value = datetime(
        2023, 1, 1, tzinfo=timezone.utc
    )

    # Already expired
    mock_sub = Subscription(
        "sub-123", "user-123", 100.0, datetime(2022, 12, 1, tzinfo=timezone.utc)
    )
    mock_sub_repo.get_subscription_by_user_id.return_value = mock_sub

    mock_payment_gateway.charge.return_value = False

    result = await service.process_renewal("user-123")

    assert result["success"] is False
    assert result["message"] == "Payment failed"
    mock_sub_repo.update_expiration.assert_not_called()


@pytest.mark.asyncio
async def test_fails_if_payment_gateway_throws(
    service,
    mock_user_repo,
    mock_sub_repo,
    mock_time_provider,
    mock_payment_gateway,
    mock_user,
):
    mock_user_repo.get_user_by_id.return_value = mock_user
    mock_time_provider.get_current_time.return_value = datetime(
        2023, 1, 1, tzinfo=timezone.utc
    )

    mock_sub = Subscription(
        "sub-123", "user-123", 100.0, datetime(2022, 12, 1, tzinfo=timezone.utc)
    )
    mock_sub_repo.get_subscription_by_user_id.return_value = mock_sub

    mock_payment_gateway.charge.side_effect = Exception("Network Error")

    result = await service.process_renewal("user-123")

    assert result["success"] is False
    assert result["message"] == "Payment gateway error"
    mock_sub_repo.update_expiration.assert_not_called()


@pytest.mark.asyncio
async def test_charges_standard_price(
    service,
    mock_user_repo,
    mock_sub_repo,
    mock_time_provider,
    mock_payment_gateway,
    mock_user,
):
    mock_user_repo.get_user_by_id.return_value = mock_user

    now = datetime(2023, 11, 15, tzinfo=timezone.utc)  # November
    mock_time_provider.get_current_time.return_value = now

    mock_sub = Subscription(
        "sub-123", "user-123", 100.0, datetime(2023, 11, 1, tzinfo=timezone.utc)
    )
    mock_sub_repo.get_subscription_by_user_id.return_value = mock_sub
    mock_payment_gateway.charge.return_value = True

    result = await service.process_renewal("user-123")

    assert result["success"] is True
    mock_payment_gateway.charge.assert_called_with("stripe-123", 100.0)

    # Should add 1 year
    expected_new_expiry = datetime(2024, 11, 15, tzinfo=timezone.utc)
    mock_sub_repo.update_expiration.assert_called_with("sub-123", expected_new_expiry)


@pytest.mark.asyncio
async def test_applies_december_discount(
    service,
    mock_user_repo,
    mock_sub_repo,
    mock_time_provider,
    mock_payment_gateway,
    mock_user,
):
    mock_user_repo.get_user_by_id.return_value = mock_user

    now = datetime(2023, 12, 15, tzinfo=timezone.utc)  # December
    mock_time_provider.get_current_time.return_value = now

    mock_sub = Subscription(
        "sub-123", "user-123", 100.0, datetime(2023, 12, 1, tzinfo=timezone.utc)
    )
    mock_sub_repo.get_subscription_by_user_id.return_value = mock_sub
    mock_payment_gateway.charge.return_value = True

    result = await service.process_renewal("user-123")

    assert result["success"] is True
    # 10% discount on 100 is 90
    mock_payment_gateway.charge.assert_called_with("stripe-123", 90.0)
