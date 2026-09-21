CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    stripe_customer_id VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id),
    base_price DECIMAL(10,2) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- Seed Data (used for submission tests)
-- Valid User (Expired)
INSERT INTO users (id, stripe_customer_id) VALUES ('user-expired-123', 'cus_expired123') ON CONFLICT DO NOTHING;
INSERT INTO subscriptions (id, user_id, base_price, expires_at) VALUES ('sub-expired-123', 'user-expired-123', 100.00, '2023-01-01 00:00:00') ON CONFLICT DO NOTHING;

-- Unexpired User
INSERT INTO users (id, stripe_customer_id) VALUES ('user-active-456', 'cus_active456') ON CONFLICT DO NOTHING;
INSERT INTO subscriptions (id, user_id, base_price, expires_at) VALUES ('sub-active-456', 'user-active-456', 100.00, '2030-01-01 00:00:00') ON CONFLICT DO NOTHING;
