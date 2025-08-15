"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { pegawai } from "@/db/schema";

/* ------------------ CREATE ------------------ */
const CreatePegawaiSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  nip: z.string().regex(/^\d{18}$/, "NIP harus 18 digit angka"),
  pangkat: z.string().min(1, "Pangkat wajib diisi"),
  golongan: z.string().regex(/^(I|II|III|IV)\/[A-Ea-e]$/, "Format golongan tidak valid, contoh: III/d"),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
});
export type CreatePegawaiInput = z.infer<typeof CreatePegawaiSchema>;
export type CreatePegawaiResult =
  | { ok: true }
  | { ok: false; field?: keyof CreatePegawaiInput; message: string };

export async function createPegawai(input: CreatePegawaiInput): Promise<CreatePegawaiResult> {
  const data = CreatePegawaiSchema.parse(input);
  try {
    await db.insert(pegawai).values({
      nama: data.nama,
      nip: data.nip,
      pangkat: data.pangkat,
      golongan: data.golongan.toUpperCase(),
      jabatan: data.jabatan,
    });
    revalidatePath("/dashboard/settings/pegawai");
    return { ok: true };
  } catch (err: unknown) {
    let message = "Gagal menyimpan pegawai";
    if (err instanceof Error) {
      message = err.message || message;
      if (/pegawai_nip_unique/i.test(message) || /duplicate/i.test(message)) {
        return { ok: false, field: "nip", message: "NIP sudah terdaftar" };
      }
    }
    return { ok: false, message };
  }
}

/* ------------------ UPDATE ------------------ */
const UpdatePegawaiSchema = z.object({
  id: z.string().uuid(),
  nama: z.string().min(1, "Nama wajib diisi"),
  nip: z.string().regex(/^\d{18}$/, "NIP harus 18 digit angka"),
  pangkat: z.string().min(1, "Pangkat wajib diisi"),
  golongan: z.string().regex(/^(I|II|III|IV)\/[A-Ea-e]$/, "Format golongan tidak valid, contoh: III/d"),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
});
export type UpdatePegawaiInput = z.infer<typeof UpdatePegawaiSchema>;
export type UpdatePegawaiResult =
  | { ok: true }
  | { ok: false; field?: keyof UpdatePegawaiInput; message: string };

export async function updatePegawai(input: UpdatePegawaiInput): Promise<UpdatePegawaiResult> {
  const data = UpdatePegawaiSchema.parse(input);
  try {
    await db
      .update(pegawai)
      .set({
        nama: data.nama,
        nip: data.nip,
        pangkat: data.pangkat,
        golongan: data.golongan.toUpperCase(),
        jabatan: data.jabatan,
        updatedAt: new Date(),
      })
      .where(eq(pegawai.id, data.id));

    revalidatePath("/dashboard/settings/pegawai");
    return { ok: true };
  } catch (err: unknown) {
    let message = "Gagal memperbarui pegawai";
    if (err instanceof Error) {
      message = err.message || message;
      if (/pegawai_nip_unique/i.test(message) || /duplicate/i.test(message)) {
        return { ok: false, field: "nip", message: "NIP sudah terdaftar" };
      }
    }
    return { ok: false, message };
  }
}

/* ------------------ DELETE ------------------ */
const DeletePegawaiSchema = z.object({ id: z.string().uuid() });
export type DeletePegawaiInput = z.infer<typeof DeletePegawaiSchema>;
export type DeletePegawaiResult = { ok: true } | { ok: false; message: string };

export async function deletePegawai(input: DeletePegawaiInput): Promise<DeletePegawaiResult> {
  const { id } = DeletePegawaiSchema.parse(input);
  try {
    await db.delete(pegawai).where(eq(pegawai.id, id));
    revalidatePath("/dashboard/settings/pegawai");
    return { ok: true };
  } catch (err: unknown) {
    let message = "Gagal menghapus pegawai";
    if (err instanceof Error) message = err.message || message;
    return { ok: false, message };
  }
}
