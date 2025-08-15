// /server/master/kegiatan.ts
"use server";

import { db } from "@/db/drizzle";
import { kegiatanRef } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

// Tipe baris yang kita butuhkan di combobox
export type KegiatanRow = {
  id: string;
  kode: string;
  nama: string;
  level: 5 | 6;
};

export async function listKegiatanLevel(level: 5 | 6): Promise<KegiatanRow[]> {
  const rows = await db
    .select({
      id: kegiatanRef.id,
      kode: kegiatanRef.kode,
      nama: kegiatanRef.nama,
      level: kegiatanRef.level,
    })
    .from(kegiatanRef)
    .where(eq(kegiatanRef.level, level))
    .orderBy(asc(kegiatanRef.kode));

  // pastikan level dipersempit ke union 5|6
  return rows.map((r) => ({ ...r, level: (r.level as 5 | 6) }));
}
