import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { Users } from "lucide-react";
import { UserTable } from "./_components/user-table";
import { AddUserDialog } from "./_components/add-user";

export const metadata = { title: "Manajemen User" };

export default async function UsersPage() {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.name), desc(user.createdAt));

  const total = rows.length;
  const verified = rows.filter(r => r.emailVerified).length;
  const unverified = total - verified;

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen User</h1>
              <p className="text-muted-foreground mt-1">
                Kelola data user: nama, email, status verifikasi, dan avatar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {total} Total User
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AddUserDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total" value={String(total)} description="Semua user terdaftar" />
        <StatsCard title="Terverifikasi" value={String(verified)} description="Email verified = true" />
        <StatsCard title="Belum Verifikasi" value={String(unverified)} description="Butuh verifikasi email" />
      </div>

      {/* Table */}
      <UserTable rows={rows} />
    </div>
  );
}

function StatsCard({
  title, value, description, trend,
}: { title: string; value: string; description: string; trend?: string }) {
  return (
    <div className="rounded-2xl border bg-card/50 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && <p className="text-xs text-green-600 font-medium">{trend}</p>}
      </div>
    </div>
  );
}
