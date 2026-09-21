import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import { RenewalController } from "./controllers/RenewalController";

dotenv.config();

const app = express();
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const renewalController = new RenewalController(pool);

app.post("/api/renew", (req, res) => renewalController.renew(req, res));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
