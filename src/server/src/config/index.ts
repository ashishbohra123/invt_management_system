import { createPool } from "pg"; import { config } from "./env.js";
export const pool = createPool({ host: config.DB_HOST, port: config.DB_PORT, database: config.DB_NAME, user: config.DB_USER, password: config.DB_PASSWORD, max: 20, idleTimeoutMillis: 30000 });
export { config } from "./env.js";
