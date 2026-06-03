// lib/schema.ts
// Drizzle ORM schema - single source of truth for the database structure

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  numeric,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["admin", "seller"]);
export const unitDimensionEnum = pgEnum("unit_dimension", [
  "weight",
  "volume",
  "count",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "shipped",
  "cancelled",
]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("seller"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Products ─────────────────────────────────────────────────────────────────
// Key design decisions:
//   - dimension: which physical dimension this product uses (weight/volume/count)
//   - baseUnit: the canonical stored unit ("g", "mL", "ea")
//   - stockQuantity: stored in baseUnit (NUMERIC for precision)
//   - pricePerBaseUnit: INR per 1 baseUnit (NUMERIC(20,6) for high precision)
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sku: text("sku").unique(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  dimension: unitDimensionEnum("dimension").notNull(),
  baseUnit: text("base_unit").notNull(), // "g" | "mL" | "ea"
  // NUMERIC(20,6): supports up to 99,999,999,999,999.999999 — handles
  // both nanogram-scale chemicals and multi-ton bulk shipments
  stockQuantity: numeric("stock_quantity", { precision: 20, scale: 6 })
    .notNull()
    .default("0"),
  pricePerBaseUnit: numeric("price_per_base_unit", {
    precision: 20,
    scale: 6,
  }).notNull(),
  minOrderQuantity: numeric("min_order_quantity", {
    precision: 20,
    scale: 6,
  }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Human-readable order number for display
  orderNumber: text("order_number").unique().notNull(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  // Stored as NUMERIC(20,6) in INR — sum of all line totals
  totalAmount: numeric("total_amount", { precision: 20, scale: 6 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Order Items ──────────────────────────────────────────────────────────────
// We store BOTH the display unit (what seller ordered) AND the base equivalent
// so admins can verify conversions, and we never lose information
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  // What the seller entered (display):
  orderedUnit: text("ordered_unit").notNull(), // e.g. "kg", "L", "ea"
  orderedQuantity: numeric("ordered_quantity", {
    precision: 20,
    scale: 6,
  }).notNull(),
  // Canonical base unit equivalent:
  baseQuantity: numeric("base_quantity", { precision: 20, scale: 6 }).notNull(),
  conversionFactor: numeric("conversion_factor", {
    precision: 20,
    scale: 6,
  }).notNull(),
  // Snapshot price at time of order (prevents repricing issues):
  unitPriceAtOrder: numeric("unit_price_at_order", {
    precision: 20,
    scale: 6,
  }).notNull(),
  lineTotal: numeric("line_total", { precision: 20, scale: 6 }).notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  seller: one(users, {
    fields: [orders.sellerId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ─── Notifications ─────────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // null if it's for all admins
  message: text("message").notNull(),
  type: text("type").notNull(), // "order_placed" | "order_status_updated"
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
