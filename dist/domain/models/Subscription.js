"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
class Subscription {
    id;
    user_id;
    base_price;
    expires_at;
    constructor(id, user_id, base_price, expires_at) {
        this.id = id;
        this.user_id = user_id;
        this.base_price = base_price;
        this.expires_at = expires_at;
    }
}
exports.Subscription = Subscription;
