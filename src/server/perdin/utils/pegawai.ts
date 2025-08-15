// /server/master/pegawai.ts
"use server";

import { db } from "@/db/drizzle";
import { pegawai } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

// Tipe untuk row pegawai yang dibutuhkan di combobox/select
export type PegawaiRow = {
  id: string;
  nama: string;
  nip: string;
  pangkat: string;
  golongan: string;
  jabatan: string;
};

// List semua pegawai untuk dropdown/combobox
export async function listPegawai(): Promise<PegawaiRow[]> {
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

  return rows;
}

// Ambil detail satu pegawai berdasarkan ID
export async function getPegawaiById(id: string): Promise<PegawaiRow | null> {
  const [row] = await db
    .select({
      id: pegawai.id,
      nama: pegawai.nama,
      nip: pegawai.nip,
      pangkat: pegawai.pangkat,
      golongan: pegawai.golongan,
      jabatan: pegawai.jabatan,
    })
    .from(pegawai)
    .where(eq(pegawai.id, id))
    .limit(1);

  return row || null;
}

// List pegawai dengan format untuk display (nama + info tambahan)
export async function listPegawaiForSelect(): Promise<Array<{
  id: string;
  label: string;
  nama: string;
  nip: string;
  jabatan: string;
}>> {
  const rows = await listPegawai();

  return rows.map(p => ({
    id: p.id,
    label: `${p.nama} - ${p.nip} (${p.jabatan})`,
    nama: p.nama,
    nip: p.nip,
    jabatan: p.jabatan,
  }));
}
