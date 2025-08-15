"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/drizzle";
import {
  notaDinas,
  notaPeserta,
  notaTujuan,
  destinasi,
  pegawai,
} from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

/** Path halaman untuk di-revalidate setelah write */
const NODIN_PATH = "/dashboard/perdin/nodin";

/** Ambil tipe status langsung dari enum kolom di schema */
export type NotaStatus = (typeof notaDinas.status.enumValues)[number];

/** Normalisasi Date -> "YYYY-MM-DD" */
const toISODate = (v: string | Date): string => {
  if (typeof v === "string") return v;
  return v.toISOString().slice(0, 10);
};

/** Skema input create */
const CreateNotaSchema = z.object({
  nomor: z.string().min(1, "Nomor wajib diisi"),
  tanggal: z
    .union([z.string(), z.date()])
    .transform((v) => toISODate(v))
    .refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s), "Format tanggal YYYY-MM-DD"),

  // Pejabat (opsional)
  ythPejabatId: z.string().uuid().optional(),
  dariPejabatId: z.string().uuid().optional(),
  penandatanganPejabatId: z.string().uuid().optional(),

  // Header defaults
  tembusan: z.string().min(1).default("Bendahara Pengeluaran"),
  sifat: z.string().min(1).default("Segera"),
  lampiran: z.string().min(1).default("1 (satu) Berkas"),
  hal: z.string().min(1).default("Permohonan Perjalanan Dinas"),

  // Isi
  maksud: z.string().optional().or(z.literal("")),
  tujuanIds: z.array(z.string().uuid()).default([]),
  pesertaPegawaiIds: z.array(z.string().uuid()).default([]),

  kegiatanKode: z.string().optional(),
  subKegiatanKode: z.string().optional(),
});
export type CreateNotaInput = z.infer<typeof CreateNotaSchema>;

export type CreateNotaResult =
  | { ok: true; id: string }
  | { ok: false; message: string; field?: keyof CreateNotaInput };

/** Buat Nota Dinas + peserta + tujuan (atomic) */
export async function createNotaDinas(
  input: CreateNotaInput
): Promise<CreateNotaResult> {
  const data = CreateNotaSchema.parse(input);

  try {
    const result = await db.transaction(async (tx) => {
      // insert master
      const [row] = await tx
        .insert(notaDinas)
        .values({
          nomor: data.nomor,
          tanggal: data.tanggal, // "YYYY-MM-DD"
          ythPejabatId: data.ythPejabatId,
          dariPejabatId: data.dariPejabatId,
          penandatanganPejabatId:
            data.penandatanganPejabatId ?? data.dariPejabatId,
          tembusan: data.tembusan,
          sifat: data.sifat,
          lampiran: data.lampiran,
          hal: data.hal,
          maksud: data.maksud ? data.maksud : null,
          kegiatanKode: data.kegiatanKode ?? null,
          subKegiatanKode: data.subKegiatanKode ?? null,
          // status default di DB (mis. "DRAFT")
        })
        .returning({ id: notaDinas.id });

      const notaId = row.id;

      // insert peserta (jika ada)
      if (data.pesertaPegawaiIds.length > 0) {
        await tx.insert(notaPeserta).values(
          data.pesertaPegawaiIds.map((pid, i) => ({
            notaId,
            pegawaiId: pid,
            noUrut: i + 1,
          }))
        );
      }

      // insert tujuan (jika ada)
      if (data.tujuanIds.length > 0) {
        await tx.insert(notaTujuan).values(
          data.tujuanIds.map((tid, i) => ({
            notaId,
            destinasiId: tid,
            noUrut: i + 1,
          }))
        );
      }

      return notaId;
    });

    revalidatePath(NODIN_PATH);
    return { ok: true, id: result };
  } catch (err) {
    let message = "Gagal membuat Nota Dinas";
    if (err instanceof Error) {
      message = err.message || message;
      // contoh deteksi unique violation nomor
      if (/unique/i.test(message) && /nomor/i.test(message)) {
        return {
          ok: false,
          field: "nomor",
          message: "Nomor Nota Dinas sudah terdaftar",
        };
      }
    }
    return { ok: false, message };
  }
}

/* ==========================
   List untuk tabel
   ========================== */

export type NotaListRow = {
  id: string;
  nomor: string;
  tanggal: string; // YYYY-MM-DD
  status: NotaStatus;
};

export async function listNotaDinas(): Promise<NotaListRow[]> {
  const rows = await db
    .select({
      id: notaDinas.id,
      nomor: notaDinas.nomor,
      tanggal: notaDinas.tanggal,
      status: notaDinas.status, // ← biarkan kolomnya
    })
    .from(notaDinas)
    .orderBy(desc(notaDinas.tanggal), asc(notaDinas.nomor));

  // map ke tipe final (hindari cast di dalam .select)
  return rows.map((r) => ({
    id: r.id,
    nomor: r.nomor,
    tanggal: String(r.tanggal),
    status: r.status as NotaStatus,
  }));
}

/* ==========================
   Detail satu nota
   ========================== */

export type NotaDetail = {
  id: string;
  nomor: string;
  tanggal: string;
  status: NotaStatus;
  tembusan: string;
  sifat: string;
  lampiran: string;
  hal: string;
  maksud: string | null;
  kegiatanKode: string | null;
  subKegiatanKode: string | null;
  tujuan: { id: string; nama: string; noUrut: number }[];
  peserta: {
    id: string;
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    jabatan: string | null;
    noUrut: number;
  }[];
};

export async function getNotaDetail(id: string): Promise<NotaDetail | null> {
  // master
  const [m] = await db
    .select({
      id: notaDinas.id,
      nomor: notaDinas.nomor,
      tanggal: notaDinas.tanggal,
      status: notaDinas.status,
      tembusan: notaDinas.tembusan,
      sifat: notaDinas.sifat,
      lampiran: notaDinas.lampiran,
      hal: notaDinas.hal,
      maksud: notaDinas.maksud,
      kegiatanKode: notaDinas.kegiatanKode,
      subKegiatanKode: notaDinas.subKegiatanKode,
    })
    .from(notaDinas)
    .where(eq(notaDinas.id, id))
    .limit(1);

  if (!m) return null;

  // tujuan
  const tujuanRowsRaw = await db
    .select({
      id: destinasi.id,
      nama: destinasi.nama,
      noUrut: notaTujuan.noUrut,
    })
    .from(notaTujuan)
    .innerJoin(destinasi, eq(notaTujuan.destinasiId, destinasi.id))
    .where(eq(notaTujuan.notaId, id))
    .orderBy(asc(notaTujuan.noUrut));

  const tujuanRows: NotaDetail["tujuan"] = tujuanRowsRaw.map((t) => ({
    id: t.id,
    nama: t.nama,
    noUrut: t.noUrut,
  }));

  // peserta
  const pesertaRowsRaw = await db
    .select({
      id: pegawai.id,
      nama: pegawai.nama,
      nip: pegawai.nip,
      pangkat: pegawai.pangkat,
      golongan: pegawai.golongan,
      jabatan: pegawai.jabatan,
      noUrut: notaPeserta.noUrut,
    })
    .from(notaPeserta)
    .innerJoin(pegawai, eq(notaPeserta.pegawaiId, pegawai.id))
    .where(eq(notaPeserta.notaId, id))
    .orderBy(asc(notaPeserta.noUrut));

  const pesertaRows: NotaDetail["peserta"] = pesertaRowsRaw.map((p) => ({
    id: p.id,
    nama: p.nama,
    nip: p.nip,
    pangkat: p.pangkat,
    golongan: p.golongan,
    jabatan: p.jabatan,
    noUrut: p.noUrut,
  }));

  return {
    id: m.id,
    nomor: m.nomor,
    tanggal: String(m.tanggal),
    status: m.status as NotaStatus,
    tembusan: m.tembusan,
    sifat: m.sifat,
    lampiran: m.lampiran,
    hal: m.hal,
    maksud: m.maksud,
    kegiatanKode: m.kegiatanKode,
    subKegiatanKode: m.subKegiatanKode,
    tujuan: tujuanRows,
    peserta: pesertaRows,
  };
}

/* ==========================
   Update status
   ========================== */

export async function updateNotaStatus(id: string, status: NotaStatus) {
  await db.update(notaDinas).set({ status }).where(eq(notaDinas.id, id));
  revalidatePath(NODIN_PATH);
  return { ok: true as const };
}
