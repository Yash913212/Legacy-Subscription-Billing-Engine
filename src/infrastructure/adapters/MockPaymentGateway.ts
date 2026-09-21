import { IPaymentGateway } from "../../domain/ports/IPaymentGateway";

export class MockPaymentGateway implements IPaymentGateway {
    async charge(customerId: string, amount: number): Promise<boolean> {
        console.log(`[MockPaymentGateway] Charging customer ${customerId} amount ${amount}`);
        // Simulate a successful payment
        return true;
    }
}
