// /server/master/pejabat.ts
"use server";

import { z } from "zod";
import { db } from "@/db/drizzle";
import { pejabat } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";

export async function listPejabat() {
  return db.select().from(pejabat).orderBy(asc(pejabat.nama));
}

const UpsertPejabatSchema = z.object({
  id: z.string().uuid().optional(),
  nama: z.string().min(1),
  nip: z.string().optional().or(z.literal("")),
  jabatan: z.string().min(1),
  unit: z.string().optional().or(z.literal("")),
});
export type UpsertPejabatInput = z.infer<typeof UpsertPejabatSchema>;

export async function upsertPejabat(input: UpsertPejabatInput) {
  const data = UpsertPejabatSchema.parse(input);
  if (data.id) {
    await db.update(pejabat).set({
      nama: data.nama, nip: data.nip || null, jabatan: data.jabatan, unit: data.unit || null,
      updatedAt: new Date(),
    }).where(eq(pejabat.id, data.id));
  } else {
    await db.insert(pejabat).values({
      nama: data.nama, nip: data.nip || null, jabatan: data.jabatan, unit: data.unit || null,
    });
  }
  revalidatePath("/dashboard/perjalanan-dinas/nota-dinas");
  return { ok: true } as const;
}

export async function deletePejabatAction(id: string) {
  await db.delete(pejabat).where(eq(pejabat.id, id));
  revalidatePath("/dashboard/perjalanan-dinas/nota-dinas");
  return { ok: true } as const;
}
