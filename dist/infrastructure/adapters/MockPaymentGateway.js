"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPaymentGateway = void 0;
class MockPaymentGateway {
    async charge(customerId, amount) {
        console.log(`[MockPaymentGateway] Charging customer ${customerId} amount ${amount}`);
        // Simulate a successful payment
        return true;
    }
}
exports.MockPaymentGateway = MockPaymentGateway;
