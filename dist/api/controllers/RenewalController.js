"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenewalController = void 0;
const SubscriptionBillingService_1 = require("../../domain/services/SubscriptionBillingService");
const PostgresSubscriptionRepository_1 = require("../../infrastructure/adapters/PostgresSubscriptionRepository");
const PostgresUserRepository_1 = require("../../infrastructure/adapters/PostgresUserRepository");
const MockPaymentGateway_1 = require("../../infrastructure/adapters/MockPaymentGateway");
const SystemTimeProvider_1 = require("../../infrastructure/adapters/SystemTimeProvider");
class RenewalController {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async renew(req, res) {
        try {
            const { userId } = req.body;
            if (!userId) {
                res.status(400).json({ success: false, message: "userId is required" });
                return;
            }
            // Wire up dependencies
            const subscriptionRepo = new PostgresSubscriptionRepository_1.PostgresSubscriptionRepository(this.pool);
            const userRepo = new PostgresUserRepository_1.PostgresUserRepository(this.pool);
            const paymentGateway = new MockPaymentGateway_1.MockPaymentGateway();
            const timeProvider = new SystemTimeProvider_1.SystemTimeProvider();
            const service = new SubscriptionBillingService_1.SubscriptionBillingService(subscriptionRepo, userRepo, paymentGateway, timeProvider);
            const result = await service.processRenewal(userId);
            if (result.success) {
                res.status(200).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            console.error("Error processing renewal:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}
exports.RenewalController = RenewalController;
