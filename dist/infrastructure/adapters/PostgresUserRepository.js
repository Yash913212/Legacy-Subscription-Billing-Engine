"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresUserRepository = void 0;
const User_1 = require("../../domain/models/User");
class PostgresUserRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getUserById(userId) {
        const result = await this.pool.query("SELECT id, stripe_customer_id FROM users WHERE id = $1", [userId]);
        if (result.rows.length === 0)
            return null;
        const row = result.rows[0];
        return new User_1.User(row.id, row.stripe_customer_id);
    }
}
exports.PostgresUserRepository = PostgresUserRepository;
