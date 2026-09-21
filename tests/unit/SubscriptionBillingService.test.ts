import { SubscriptionBillingService } from "../../src/domain/services/SubscriptionBillingService";
import { ISubscriptionRepository } from "../../src/domain/ports/ISubscriptionRepository";
import { IUserRepository } from "../../src/domain/ports/IUserRepository";
import { IPaymentGateway } from "../../src/domain/ports/IPaymentGateway";
import { ITimeProvider } from "../../src/domain/ports/ITimeProvider";
import { User } from "../../src/domain/models/User";
import { Subscription } from "../../src/domain/models/Subscription";

describe("SubscriptionBillingService", () => {
    let mockSubscriptionRepo: jest.Mocked<ISubscriptionRepository>;
    let mockUserRepo: jest.Mocked<IUserRepository>;
    let mockPaymentGateway: jest.Mocked<IPaymentGateway>;
    let mockTimeProvider: jest.Mocked<ITimeProvider>;
    let service: SubscriptionBillingService;

    const basePrice = 100;
    const mockUser = new User("user-123", "stripe-123");
    
    beforeEach(() => {
        mockSubscriptionRepo = {
            getSubscriptionByUserId: jest.fn(),
            updateExpiration: jest.fn()
        };

        mockUserRepo = {
            getUserById: jest.fn()
        };

        mockPaymentGateway = {
            charge: jest.fn()
        };

        mockTimeProvider = {
            getCurrentTime: jest.fn()
        };

        service = new SubscriptionBillingService(
            mockSubscriptionRepo,
            mockUserRepo,
            mockPaymentGateway,
            mockTimeProvider
        );
    });

    it("should fail gracefully if user is not found", async () => {
        mockUserRepo.getUserById.mockResolvedValue(null);
        
        const result = await service.processRenewal("non-existent");
        
        expect(result.success).toBe(false);
        expect(result.message).toBe("User not found");
        expect(mockPaymentGateway.charge).not.toHaveBeenCalled();
    });

    it("should fail gracefully if subscription is not found", async () => {
        mockUserRepo.getUserById.mockResolvedValue(mockUser);
        mockSubscriptionRepo.getSubscriptionByUserId.mockResolvedValue(null);
        
        const result = await service.processRenewal("user-123");
        
        expect(result.success).toBe(false);
        expect(result.message).toBe("Subscription not found");
        expect(mockPaymentGateway.charge).not.toHaveBeenCalled();
    });

    it("should fail if subscription is not yet expired", async () => {
        mockUserRepo.getUserById.mockResolvedValue(mockUser);
        mockTimeProvider.getCurrentTime.mockReturnValue(new Date("2023-01-01T00:00:00Z"));
        // Expired in the future
        const mockSub = new Subscription("sub-123", "user-123", basePrice, new Date("2023-02-01T00:00:00Z"));
        mockSubscriptionRepo.getSubscriptionByUserId.mockResolvedValue(mockSub);
        
        const result = await service.processRenewal("user-123");
        
        expect(result.success).toBe(false);
        expect(result.message).toBe("Subscription is not yet expired");
        expect(mockPaymentGateway.charge).not.toHaveBeenCalled();
    });

    it("should fail gracefully if the payment gateway fails", async () => {
        mockUserRepo.getUserById.mockResolvedValue(mockUser);
        mockTimeProvider.getCurrentTime.mockReturnValue(new Date("2023-01-01T00:00:00Z"));
        // Already expired
        const mockSub = new Subscription("sub-123", "user-123", basePrice, new Date("2022-12-01T00:00:00Z"));
        mockSubscriptionRepo.getSubscriptionByUserId.mockResolvedValue(mockSub);
        
        mockPaymentGateway.charge.mockResolvedValue(false); // Gateway returns false
        
        const result = await service.processRenewal("user-123");
        
        expect(result.success).toBe(false);
        expect(result.message).toBe("Payment failed");
        expect(mockSubscriptionRepo.updateExpiration).not.toHaveBeenCalled();
    });

    it("should fail gracefully if the payment gateway throws an error", async () => {
        mockUserRepo.getUserById.mockResolvedValue(mockUser);
        mockTimeProvider.getCurrentTime.mockReturnValue(new Date("2023-01-01T00:00:00Z"));
        // Already expired
        const mockSub = new Subscription("sub-123", "user-123", basePrice, new Date("2022-12-01T00:00:00Z"));
        mockSubscriptionRepo.getSubscriptionByUserId.mockResolvedValue(mockSub);
        
        mockPaymentGateway.charge.mockRejectedValue(new Error("Network Error"));
        
        const result = await service.processRenewal("user-123");
        
        expect(result.success).toBe(false);
        expect(result.message).toBe("Payment gateway error");
        expect(mockSubscriptionRepo.updateExpiration).not.toHaveBeenCalled();
    });

    it("should charge standard price in non-December months and add 1 year", async () => {
        mockUserRepo.getUserById.mockResolvedValue(mockUser);
        
        const currentTime = new Date("2023-11-15T10:00:00Z"); // November
        mockTimeProvider.getCurrentTime.mockReturnValue(currentTime);
        
        const mockSub = new Subscription("sub-123", "user-123", basePrice, new Date("2023-11-01T00:00:00Z"));
        mockSubscriptionRepo.getSubscriptionByUserId.mockResolvedValue(mockSub);
        
        mockPaymentGateway.charge.mockResolvedValue(true);
        
        const result = await service.processRenewal("user-123");
        
        expect(result.success).toBe(true);
        expect(result.message).toBe("Renewal successful");
        expect(mockPaymentGateway.charge).toHaveBeenCalledWith("stripe-123", 100);
        
        const expectedNewExpiry = new Date(currentTime);
        expectedNewExpiry.setFullYear(currentTime.getFullYear() + 1);
        expect(mockSubscriptionRepo.updateExpiration).toHaveBeenCalledWith("sub-123", expectedNewExpiry);
    });

    it("should apply a 10% discount if the renewal happens in December", async () => {
        mockUserRepo.getUserById.mockResolvedValue(mockUser);
        
        const currentTime = new Date("2023-12-15T10:00:00Z"); // December
        mockTimeProvider.getCurrentTime.mockReturnValue(currentTime);
        
        const mockSub = new Subscription("sub-123", "user-123", basePrice, new Date("2023-12-01T00:00:00Z"));
        mockSubscriptionRepo.getSubscriptionByUserId.mockResolvedValue(mockSub);
        
        mockPaymentGateway.charge.mockResolvedValue(true);
        
        const result = await service.processRenewal("user-123");
        
        expect(result.success).toBe(true);
        expect(result.message).toBe("Renewal successful");
        // 10% discount on 100 is 90
        expect(mockPaymentGateway.charge).toHaveBeenCalledWith("stripe-123", 90);
    });
});
