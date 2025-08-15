"use server";

import { db } from "@/db/drizzle";
import { destinasi } from "@/db/schema";
import { DestinasiRow } from "@/types/perdin";
import { asc, eq } from "drizzle-orm";

export async function listDestinasi(): Promise<DestinasiRow[]> {
  const rows = await db
    .select({ id: destinasi.id, nama: destinasi.nama })
    .from(destinasi)
    .orderBy(asc(destinasi.nama));
  return rows;
}

export async function upsertDestinasi(input: { id?: string; nama: string }) {
  const name = (input.nama ?? "").trim();
  if (!name) return { ok: false as const, message: "Nama destinasi wajib diisi" };

  try {
    if (input.id) {
      await db.update(destinasi).set({ nama: name }).where(eq(destinasi.id, input.id));
      return { ok: true as const, id: input.id };
    } else {
      const [row] = await db.insert(destinasi).values({ nama: name }).returning({ id: destinasi.id });
      return { ok: true as const, id: row.id };
    }
  } catch (error) {
    console.error("Error upserting destinasi:", error);
    return { ok: false as const, message: "Gagal menyimpan destinasi" };
  }
}

export async function deleteDestinasiAction(id: string) {
  try {
    await db.delete(destinasi).where(eq(destinasi.id, id));
    return { ok: true as const };
  } catch (error: unknown) {
    console.error("Error deleting destinasi:", error);

    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key')) {
      return {
        ok: false as const,
        message: "Destinasi sedang digunakan dalam nota dinas dan tidak dapat dihapus"
      };
    }

    return {
      ok: false as const,
      message: "Gagal menghapus destinasi"
    };
  }
}
