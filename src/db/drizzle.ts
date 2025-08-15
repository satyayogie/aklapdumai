import {config} from "dotenv"
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

config({path: ".env"});

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool);
