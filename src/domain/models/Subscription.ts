export class Subscription {
    constructor(
        public id: string,
        public user_id: string,
        public base_price: number,
        public expires_at: Date
    ) {}
}
