"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    id;
    stripe_customer_id;
    constructor(id, stripe_customer_id) {
        this.id = id;
        this.stripe_customer_id = stripe_customer_id;
    }
}
exports.User = User;
