import { Request, Response } from "express";
import { SubscriptionBillingService } from "../../domain/services/SubscriptionBillingService";
import { PostgresSubscriptionRepository } from "../../infrastructure/adapters/PostgresSubscriptionRepository";
import { PostgresUserRepository } from "../../infrastructure/adapters/PostgresUserRepository";
import { MockPaymentGateway } from "../../infrastructure/adapters/MockPaymentGateway";
import { SystemTimeProvider } from "../../infrastructure/adapters/SystemTimeProvider";
import { Pool } from "pg";

export class RenewalController {
    constructor(private pool: Pool) {}

    async renew(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.body;
            if (!userId) {
                res.status(400).json({ success: false, message: "userId is required" });
                return;
            }

            // Wire up dependencies
            const subscriptionRepo = new PostgresSubscriptionRepository(this.pool);
            const userRepo = new PostgresUserRepository(this.pool);
            const paymentGateway = new MockPaymentGateway();
            const timeProvider = new SystemTimeProvider();

            const service = new SubscriptionBillingService(
                subscriptionRepo,
                userRepo,
                paymentGateway,
                timeProvider
            );

            const result = await service.processRenewal(userId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error("Error processing renewal:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}
