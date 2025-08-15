import { db } from "@/db/drizzle";
import { asc } from "drizzle-orm";
import { PegawaiTable } from "./_components/pegawai-table";
import { pegawai } from "@/db/schema";
import { AddPegawaiDialog } from "./_components/add-pegawai";
import { Users } from "lucide-react";

export default async function PegawaiPage() {
  const rows = await db
    .select({
      id: pegawai.id,
      nama: pegawai.nama,
      nip: pegawai.nip,
      pangkat: pegawai.pangkat,
      golongan: pegawai.golongan,
      jabatan: pegawai.jabatan,
    })
    .from(pegawai)
    .orderBy(asc(pegawai.nama));

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
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Manajemen Pegawai
              </h1>
              <p className="text-muted-foreground mt-1">
                Kelola data pegawai dengan NIP, pangkat, golongan, dan jabatan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {rows.length} Total Pegawai
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AddPegawaiDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatsCard
          title="Total Pegawai"
          value={rows.length.toString()}
          description="Semua pegawai aktif"
          trend="+12 bulan ini"
        />
        <StatsCard
          title="Golongan I–II"
          value={rows.filter(r => r.golongan.startsWith("I") && !r.golongan.startsWith("III") && !r.golongan.startsWith("IV")).length.toString()}
          description="Pegawai junior"
        />
        <StatsCard
          title="Golongan III"
          value={rows.filter(r => r.golongan.startsWith("III")).length.toString()}
          description="Pegawai menengah"
        />
        <StatsCard
          title="Golongan IV"
          value={rows.filter(r => r.golongan.startsWith("IV")).length.toString()}
          description="Pegawai senior"
        />
      </div>

      {/* Tabel utama */}
      <PegawaiTable rows={rows} />
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  trend
}: {
  title: string;
  value: string;
  description: string;
  trend?: string;
}) {
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
