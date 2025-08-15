"use server";

import { db } from "@/db/drizzle";
import { notaPreviews, pejabat, pegawai, destinasi, kegiatanRef } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createNotaDinas, type CreateNotaInput } from "./nodin";

// Type definitions untuk form dan data
export type NotaForm = {
  nomor: string;
  tanggal: string;
  ythPejabatId?: string;
  dariPejabatId?: string;
  penandatanganPejabatId?: string;
  tembusan: string;
  sifat: string;
  lampiran: string;
  hal: string;
  maksud?: string;
  tujuanIds: string[];
  pesertaPegawaiIds: string[];
  kegiatanKode?: string;
  subKegiatanKode?: string;
  sameSignerAsDari?: boolean;
};

// Types untuk data yang sudah di-resolved
export type ResolvedPejabat = {
  id: string;
  nama: string;
  nip?: string | null; // Change to allow null from database
  jabatan: string;
  unit?: string | null; // Change to allow null from database
};

export type ResolvedPegawai = {
  id: string;
  nama: string;
  nip: string;
  pangkat: string;
  golongan: string;
  jabatan: string;
};

export type ResolvedDestinasi = {
  id: string;
  nama: string;
};

export type ResolvedKegiatan = {
  kode: string;
  nama: string;
};

export type NotaFormResolved = NotaForm & {
  ythPejabat?: ResolvedPejabat;
  dariPejabat?: ResolvedPejabat;
  penandatanganPejabat?: ResolvedPejabat;
  tujuanList: ResolvedDestinasi[];
  pesertaList: ResolvedPegawai[];
  kegiatanData?: ResolvedKegiatan;
  subKegiatanData?: ResolvedKegiatan;
};

// 1) Simpan draft & balikan draftId
export async function createNotaDraft(payload: NotaForm) {
  console.log("Creating draft with payload:", payload);

  try {
    const [row] = await db
      .insert(notaPreviews)
      .values({ payload })
      .returning({ id: notaPreviews.id });

    console.log("Draft created with ID:", row.id);
    return row.id as string;
  } catch (error) {
    console.error("Error creating draft:", error);
    throw new Error("Gagal membuat draft");
  }
}

// 2) Ambil draft dengan data yang sudah di-resolve
export async function getNotaDraft(draftId: string): Promise<NotaFormResolved> {
  console.log("Getting draft with ID:", draftId);

  try {
    const [row] = await db
      .select()
      .from(notaPreviews)
      .where(eq(notaPreviews.id, draftId))
      .limit(1);

    if (!row) {
      console.error("Draft not found with ID:", draftId);
      throw new Error("Draft tidak ditemukan");
    }

    const payload = row.payload as NotaForm;
    console.log("Raw payload:", payload);

    // Resolve semua data terkait
    const resolvedData = await resolveNotaData(payload);

    return resolvedData;
  } catch (error) {
    console.error("Error getting draft:", error);
    if (error instanceof Error && error.message === "Draft tidak ditemukan") {
      throw error;
    }
    throw new Error("Gagal mengambil data draft");
  }
}

// Helper function untuk resolve semua data terkait
async function resolveNotaData(payload: NotaForm): Promise<NotaFormResolved> {
  const resolved: NotaFormResolved = {
    ...payload,
    tujuanList: [],
    pesertaList: [],
  };

  try {
    // Resolve pejabat data
    const pejabatIds = [
      payload.ythPejabatId,
      payload.dariPejabatId,
      payload.penandatanganPejabatId
    ].filter(Boolean) as string[];

    if (pejabatIds.length > 0) {
      const pejabatData = await db
        .select({
          id: pejabat.id,
          nama: pejabat.nama,
          nip: pejabat.nip,
          jabatan: pejabat.jabatan,
          unit: pejabat.unit,
        })
        .from(pejabat)
        .where(inArray(pejabat.id, pejabatIds));

      const pejabatMap = new Map(pejabatData.map(p => [p.id, p]));

      if (payload.ythPejabatId) {
        resolved.ythPejabat = pejabatMap.get(payload.ythPejabatId) || undefined;
      }
      if (payload.dariPejabatId) {
        resolved.dariPejabat = pejabatMap.get(payload.dariPejabatId) || undefined;
      }
      if (payload.penandatanganPejabatId) {
        resolved.penandatanganPejabat = pejabatMap.get(payload.penandatanganPejabatId) || undefined;
      }
    }

    // Resolve destinasi/tujuan data
    if (payload.tujuanIds && payload.tujuanIds.length > 0) {
      const destinasiData = await db
        .select({
          id: destinasi.id,
          nama: destinasi.nama,
        })
        .from(destinasi)
        .where(inArray(destinasi.id, payload.tujuanIds));

      // Maintain order sesuai dengan urutan di tujuanIds
      resolved.tujuanList = payload.tujuanIds
        .map(id => destinasiData.find(d => d.id === id))
        .filter(Boolean) as ResolvedDestinasi[];
    }

    // Resolve pegawai/peserta data
    if (payload.pesertaPegawaiIds && payload.pesertaPegawaiIds.length > 0) {
      const pegawaiData = await db
        .select({
          id: pegawai.id,
          nama: pegawai.nama,
          nip: pegawai.nip,
          pangkat: pegawai.pangkat,
          golongan: pegawai.golongan,
          jabatan: pegawai.jabatan,
        })
        .from(pegawai)
        .where(inArray(pegawai.id, payload.pesertaPegawaiIds));

      // Maintain order sesuai dengan urutan di pesertaPegawaiIds
      resolved.pesertaList = payload.pesertaPegawaiIds
        .map(id => pegawaiData.find(p => p.id === id))
        .filter(Boolean) as ResolvedPegawai[];
    }

    // Resolve kegiatan data
    const kegiatanKodes = [payload.kegiatanKode, payload.subKegiatanKode].filter(Boolean) as string[];
    if (kegiatanKodes.length > 0) {
      const kegiatanData = await db
        .select({
          kode: kegiatanRef.kode,
          nama: kegiatanRef.nama,
        })
        .from(kegiatanRef)
        .where(inArray(kegiatanRef.kode, kegiatanKodes));

      const kegiatanMap = new Map(kegiatanData.map(k => [k.kode, k]));

      if (payload.kegiatanKode) {
        resolved.kegiatanData = kegiatanMap.get(payload.kegiatanKode) || undefined;
      }
      if (payload.subKegiatanKode) {
        resolved.subKegiatanData = kegiatanMap.get(payload.subKegiatanKode) || undefined;
      }
    }

    console.log("Resolved data:", {
      pejabatCount: pejabatIds.length,
      tujuanCount: resolved.tujuanList.length,
      pesertaCount: resolved.pesertaList.length,
      hasKegiatan: !!resolved.kegiatanData,
      hasSubKegiatan: !!resolved.subKegiatanData,
    });

    return resolved;
  } catch (error) {
    console.error("Error resolving data:", error);
    throw new Error("Gagal memproses data terkait");
  }
}

// 3) Simpan menjadi nota permanen
export async function persistNotaFromDraft(draftId: string) {
  console.log("Persisting draft with ID:", draftId);

  try {
    // PERBAIKAN: Pastikan draft masih ada sebelum memproses
    const [draftRow] = await db
      .select()
      .from(notaPreviews)
      .where(eq(notaPreviews.id, draftId))
      .limit(1);

    if (!draftRow) {
      console.error("Draft not found when persisting:", draftId);
      throw new Error("Draft tidak ditemukan saat menyimpan");
    }

    const payload = await getNotaDraft(draftId);
    console.log("Payload to persist:", payload);

    // Transform NotaForm ke CreateNotaInput
    const notaInput: CreateNotaInput = {
      nomor: `090/ND/${payload.nomor.padStart(3, '0')}/BPKAD`, // Format nomor lengkap di sini
      tanggal: payload.tanggal,
      ythPejabatId: payload.ythPejabatId || undefined,
      dariPejabatId: payload.dariPejabatId || undefined,
      penandatanganPejabatId: payload.penandatanganPejabatId || payload.dariPejabatId || undefined,
      tembusan: payload.tembusan,
      sifat: payload.sifat,
      lampiran: payload.lampiran,
      hal: payload.hal,
      maksud: payload.maksud || "",
      tujuanIds: payload.tujuanIds || [],
      pesertaPegawaiIds: payload.pesertaPegawaiIds || [],
      kegiatanKode: payload.kegiatanKode || undefined,
      subKegiatanKode: payload.subKegiatanKode || undefined,
    };

    console.log("Transformed input:", notaInput);

    const result = await createNotaDinas(notaInput);

    if (!result.ok) {
      console.error("Error creating nota:", result);
      throw new Error(result.message);
    }

    console.log("Nota created successfully with ID:", result.id);

    // Hapus draft setelah berhasil disimpan
    try {
      await db.delete(notaPreviews).where(eq(notaPreviews.id, draftId));
      console.log("Draft deleted successfully");
    } catch (error) {
      console.warn("Failed to delete draft:", error);
    }

    return result.id;
  } catch (error) {
    console.error("Error persisting nota:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Gagal menyimpan nota dinas");
  }
}
