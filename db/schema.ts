import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
export const scans = sqliteTable("sentinel_scans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  createdAt: text("created_at").notNull(),
  result: text("result").notNull(),
}, table => [index("sentinel_scans_user_created").on(table.userId, table.createdAt)]);
export const preferences = sqliteTable("sentinel_preferences", {
  userId: text("user_id").primaryKey(),
  fullName: text("full_name").notNull().default(""),
  analysisLanguage: text("analysis_language").notNull().default("auto"),
});
