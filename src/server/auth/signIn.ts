"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { auth } from "@/lib/auth"

// Schema validation
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

export type SignInResult = {
  success: boolean
  message: string
  redirectTo?: string
}

// Main sign-in function - bisa dipanggil dari komponen atau form action
export async function signInAction(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    // Validasi input
    const validatedFields = signInSchema.safeParse({ email, password })

    if (!validatedFields.success) {
      return {
        success: false,
        message: validatedFields.error.issues[0]?.message || "Invalid input data"
      }
    }

    const { email: validEmail, password: validPassword } = validatedFields.data

    // Direct auth call - tidak perlu wrapper function terpisah
    await auth.api.signInEmail({
      body: {
        email: validEmail,
        password: validPassword,
      }
    })

    return {
      success: true,
      message: "Successfully signed in",
      redirectTo: "/dashboard"
    }

  } catch (error) {
    console.error("Sign-in error:", error)
    const e = error as Error

    return {
      success: false,
      message: e.message || "An unexpected error occurred. Please try again."
    }
  }
}

// Form action wrapper - untuk form submission dengan auto-redirect
export async function signInFormAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const result = await signInAction(email, password)

  // Auto redirect jika berhasil
  if (result.success && result.redirectTo) {
    redirect(result.redirectTo)
  }

  // Return result untuk error handling di client
  return result
}
