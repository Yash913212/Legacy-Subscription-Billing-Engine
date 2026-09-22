# Subscription Billing Engine (Refactored to Python)

Welcome to the **Subscription Billing Engine**! This project demonstrates how to rescue a tightly coupled, impossible-to-test "God Class" and refactor it into a clean, maintainable, and highly testable architecture using **SOLID principles** and the **Ports and Adapters (Hexagonal) Architecture** in **Python**.

## 📖 The Problem We Solved

In many fast-moving startups, code is often written with speed in mind rather than maintainability. A common anti-pattern is the "God Class"—a massive function that talks directly to the database, makes HTTP calls to third-party APIs (like Stripe), reads the system clock, and processes complex business rules all at once.

This procedural style of coding introduces massive technical debt because it makes the code **impossible to test**. To test a simple business rule (like a 10% December discount), a developer would have to:
- Spin up a local database and seed it.
- Hit a real (or sandbox) Stripe API endpoint.
- Somehow spoof the global operating system clock.

## 🏗️ The Solution: Ports and Adapters

We refactored the legacy system by completely isolating our core domain logic from the outside world. The application is now split into distinct layers:

1. **Domain Layer (`src/domain`):** This is the heart of the application. It contains our pure business logic (`SubscriptionBillingService`), models (Dataclasses), and interfaces (Ports). It knows *absolutely nothing* about Postgres, FastAPI, or Stripe. It only knows about the contracts (interfaces via `abc.ABC`) it requires to do its job.
2. **Infrastructure Layer (`src/infrastructure`):** This is where the dirty work happens. It contains the concrete implementations (Adapters) that fulfill our Domain Ports—like the Postgres SQL queries via `asyncpg`, the system clock wrapper, and the simulated Stripe payment gateway.
3. **API Layer (`src/api`):** The entry point of our application built with **FastAPI**. It wires the concrete adapters together, injects them into the Domain Service (Dependency Injection), and handles HTTP requests.

Because of this separation, we can now test 100% of our business rules in complete isolation using simple `unittest.mock` objects in `pytest`!

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Python 3.11+](https://www.python.org/) (if running locally without Docker)

### Running with Docker Compose

The easiest way to get the application up and running is via Docker. This will automatically spin up the Postgres database, run migrations, seed test data, and start the FastAPI application on port 3000.

```bash
# 1. Clone the repository and navigate to the root directory
# 2. Copy the example environment variables
cp .env.example .env

# 3. Boot up the infrastructure
docker compose up -d --build
```

### Testing the API

Once the containers are running, you can test the `POST /api/renew` endpoint. We have pre-seeded the database with test users.

**1. Successful Renewal (Expired User):**
```bash
curl -X POST http://localhost:3000/api/renew \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-expired-123"}'
```
*Expected Output: `{"success": true, "message": "Renewal successful"}`*

**2. Business Rule Failure (User Not Expired):**
```bash
curl -X POST http://localhost:3000/api/renew \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-active-456"}'
```
*Expected Output: `{"success": false, "message": "Subscription is not yet expired"}`*

## 🧪 Running the Unit Tests

The crowning achievement of this refactoring is the isolated unit test suite. We can verify every temporal and business rule in milliseconds without a database or internet connection.

```bash
# Setup a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the test suite
PYTHONPATH=. pytest tests/
```

You should see that the test suite achieves **100% Line Coverage** for the domain layer.

## 📁 Project Structure

```text
├── docs/
│   └── ADR-001-Refactoring-God-Class.md  # Architecture decision record
├── src/
│   ├── domain/
│   │   ├── models/                       # Plain data objects (user, subscription)
│   │   ├── ports/                        # Interfaces (time_provider, payment_gateway, etc.)
│   │   └── services/                     # Core logic (subscription_billing_service)
│   ├── infrastructure/
│   │   ├── adapters/                     # Concrete implementations (Postgres, Mock Stripe)
│   │   └── database/                     # SQL schema and seed files
│   └── api/
│       ├── routers/                      # HTTP route handlers
│       └── main.py                       # FastAPI app setup
├── tests/
│   └── unit/                             # Fast, isolated tests using pytest
├── .env.example
├── docker-compose.yml
└── requirements.txt
```

## 📝 Architecture Decision Record (ADR)

For a deeper dive into *why* we made these structural changes and the specific code smells we addressed, please read the formal [Architecture Decision Record](./docs/ADR-001-Refactoring-God-Class.md).
