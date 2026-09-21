"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionBillingService = void 0;
class SubscriptionBillingService {
    subscriptionRepo;
    userRepo;
    paymentGateway;
    timeProvider;
    constructor(subscriptionRepo, userRepo, paymentGateway, timeProvider) {
        this.subscriptionRepo = subscriptionRepo;
        this.userRepo = userRepo;
        this.paymentGateway = paymentGateway;
        this.timeProvider = timeProvider;
    }
    async processRenewal(userId) {
        const user = await this.userRepo.getUserById(userId);
        if (!user)
            return { success: false, message: "User not found" };
        const sub = await this.subscriptionRepo.getSubscriptionByUserId(userId);
        if (!sub)
            return { success: false, message: "Subscription not found" };
        const now = this.timeProvider.getCurrentTime();
        // BUSINESS RULE 1: Cannot renew if not expired
        if (new Date(sub.expires_at) > now) {
            return { success: false, message: "Subscription is not yet expired" };
        }
        let chargeAmount = Number(sub.base_price); // ensure it's a number
        // BUSINESS RULE 2: December Promotional Discount (10% off)
        if (now.getMonth() === 11) { // 11 is December in 0-indexed JS dates
            chargeAmount = chargeAmount * 0.9;
        }
        try {
            const chargeSuccess = await this.paymentGateway.charge(user.stripe_customer_id, chargeAmount);
            if (chargeSuccess) {
                // BUSINESS RULE 3: Add exactly 1 year to current time for next expiry
                const newExpiry = new Date(now);
                newExpiry.setFullYear(newExpiry.getFullYear() + 1);
                await this.subscriptionRepo.updateExpiration(sub.id, newExpiry);
                return { success: true, message: "Renewal successful" };
            }
            else {
                return { success: false, message: "Payment failed" };
            }
        }
        catch (error) {
            return { success: false, message: "Payment gateway error" };
        }
    }
}
exports.SubscriptionBillingService = SubscriptionBillingService;
