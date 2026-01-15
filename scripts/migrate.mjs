#!/usr/bin/env node
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
});

const db = drizzle(pool);

async function runMigrations() {
  try {
    // 检查迁移历史表是否存在
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'drizzle'
        AND table_name = '__drizzle_migrations'
      );
    `);

    const tableExists = result.rows[0]?.exists;

    if (!tableExists) {
      console.log("首次部署，执行数据库迁移...");
      await migrate(db, { migrationsFolder: "./drizzle" });
      console.log("✓ 迁移完成");
    } else {
      console.log("迁移历史已存在，跳过迁移");
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("迁移检查失败:", error);
    await pool.end();
    // 不阻止构建继续
    process.exit(0);
  }
}

runMigrations();
