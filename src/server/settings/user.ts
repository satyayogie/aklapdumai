"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/* ---------------- CREATE ---------------- */
const CreateUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid").max(255),
  image: z.string().url("URL gambar tidak valid").max(1024).optional().or(z.literal("")),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type CreateUserResult =
  | { ok: true }
  | { ok: false; field?: keyof CreateUserInput; message: string };

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const data = CreateUserSchema.parse(input);
  try {
    await db.insert(user).values({
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email.toLowerCase(),
      image: data.image && data.image.length > 0 ? data.image : null,
      emailVerified: false,
    });
    revalidatePath("/dashboard/settings/users");
    return { ok: true };
  } catch (err: unknown) {
    let message = "Gagal membuat user";
    if (err instanceof Error) {
      message = err.message || message;
      // constraint dari drizzle biasanya "user_email_unique"
      if (/user.*email.*unique/i.test(message) || /unique/i.test(message)) {
        return { ok: false, field: "email", message: "Email sudah terdaftar" };
      }
    }
    return { ok: false, message };
  }
}

/* ---------------- UPDATE ---------------- */
const UpdateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid").max(255),
  image: z.string().url("URL gambar tidak valid").max(1024).optional().or(z.literal("")),
  emailVerified: z.boolean(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateUserResult =
  | { ok: true }
  | { ok: false; field?: keyof UpdateUserInput; message: string };

export async function updateUser(input: UpdateUserInput): Promise<UpdateUserResult> {
  const data = UpdateUserSchema.parse(input);
  try {
    await db
      .update(user)
      .set({
        name: data.name,
        email: data.email.toLowerCase(),
        image: data.image && data.image.length > 0 ? data.image : null,
        emailVerified: data.emailVerified,
        updatedAt: new Date(),
      })
      .where(eq(user.id, data.id));

    revalidatePath("/dashboard/settings/users");
    return { ok: true };
  } catch (err: unknown) {
    let message = "Gagal memperbarui user";
    if (err instanceof Error) {
      message = err.message || message;
      if (/user.*email.*unique/i.test(message) || /unique/i.test(message)) {
        return { ok: false, field: "email", message: "Email sudah terdaftar" };
      }
    }
    return { ok: false, message };
  }
}

/* ---------------- DELETE ---------------- */
const DeleteUserSchema = z.object({ id: z.string().min(1) });
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
export type DeleteUserResult = { ok: true } | { ok: false; message: string };

export async function deleteUser(input: DeleteUserInput): Promise<DeleteUserResult> {
  const { id } = DeleteUserSchema.parse(input);
  try {
    await db.delete(user).where(eq(user.id, id));
    revalidatePath("/dashboard/settings/users");
    return { ok: true };
  } catch (err: unknown) {
    let message = "Gagal menghapus user";
    if (err instanceof Error) message = err.message || message;
    return { ok: false, message };
  }
}
