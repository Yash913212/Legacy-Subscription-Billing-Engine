# Context
The legacy `SubscriptionManager` class was tightly coupled, mixing database queries, external payment API calls, time-based rules, and business logic into a single monolithic method. This violated the Single Responsibility Principle and Dependency Inversion Principle, leading to severe testability issues. It was impossible to test the business logic (e.g., promotional discounts or expiration rules) without a running database, an internet connection for Stripe, and mocking the global system clock.

# Decision
We are adopting a Ports and Adapters (Hexagonal) Architecture with Dependency Injection.
- **Ports (Interfaces):** We defined explicit interfaces for `ITimeProvider`, `IPaymentGateway`, `ISubscriptionRepository`, and `IUserRepository` in the domain layer.
- **Domain Service:** `SubscriptionBillingService` depends strictly on these interfaces, injected via its constructor. It executes pure business rules.
- **Adapters:** We implemented concrete classes (`SystemTimeProvider`, `PostgresSubscriptionRepository`, `MockPaymentGateway`) in the infrastructure layer that implement these interfaces and handle the actual I/O.
- **API Controller:** Serves as the entry point, responsible for instantiating the concrete adapters and injecting them into the service.

# Consequences
**Positive:**
- Achieved 100% deterministic testability of the core business logic. We can now simulate any point in time or any external API failure using simple mock objects.
- High decoupling. We can swap PostgreSQL for MySQL or Stripe for PayPal without modifying any core business rules.

**Negative:**
- Increased boilerplate and file count. We now have separate files for interfaces, concrete adapters, and domain services rather than a single inline script.
- Slightly higher cognitive load for developers unfamiliar with Dependency Injection.

# Code Smells Addressed
1. **Hidden Dependencies (Direct instantiation):** Addressed by using Constructor Injection for Repositories and Gateways instead of `new Database()` inside methods.
2. **Temporal Coupling (Non-deterministic time):** Addressed by replacing `new Date()` with an injected `ITimeProvider`, allowing us to stub the clock in tests.
3. **I/O Interleaving (Mixed concerns):** Addressed by moving all HTTP calls to the external API out of the business logic and into the `MockPaymentGateway` adapter.
