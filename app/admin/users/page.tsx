// app/admin/users/page.tsx
import { db } from "@/lib/db";
import { users, orders } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      orderCount: count(orders.id),
    })
    .from(users)
    .leftJoin(orders, eq(orders.sellerId, users.id))
    .where(eq(users.role, "seller"))
    .groupBy(users.id)
    .orderBy(users.createdAt);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{allUsers.length} registered sellers</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Orders</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ color: "var(--muted-foreground)" }}>{u.email}</td>
                <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                <td>{u.orderCount}</td>
                <td style={{ color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
