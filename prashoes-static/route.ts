import { NextResponse } from "next/server";
import { Pool } from "pg";

// Initialise a connection pool. In a real deployment you may want to reuse a singleton.
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId")?.trim();
  const phone = searchParams.get("phone")?.trim();
  const email = searchParams.get("email")?.trim();

  const conditions: string[] = [];
  const values: any[] = [];

  if (orderId) {
    conditions.push(`order_code = $${values.length + 1}`);
    values.push(orderId);
  }
  if (phone) {
    conditions.push(`phone = $${values.length + 1}`);
    values.push(phone);
  }
  if (email) {
    conditions.push(`email = $${values.length + 1}`);
    values.push(email);
  }

  if (conditions.length === 0) {
    return NextResponse.json({ error: "No identifier supplied" }, { status: 400 });
  }

  const query = `
    SELECT order_code, status, created_at, updated_at, items
    FROM orders
    WHERE ${conditions.join(" OR ")}
    LIMIT 1
  `;

  try {
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const row = rows[0];
    const result = {
      order_code: row.order_code,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      items: row.items || [],
    };
    const response = NextResponse.json(result);
    // Uncomment for CORS if needed:
    // response.headers.set("Access-Control-Allow-Origin", "*");
    // response.headers.set("Access-Control-Allow-Methods", "GET");
    // response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  } catch (err) {
    console.error("Database error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
