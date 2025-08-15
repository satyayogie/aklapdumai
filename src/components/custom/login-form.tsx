"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { signInAction } from "@/server/auth/signIn"

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

type FormData = z.infer<typeof formSchema>

// Alternative simple spinner using Lucide Loader2
const SimpleLoader = ({ size = 16 }: { size?: number }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{
      duration: 1,
      repeat: Infinity,
      ease: "linear",
      repeatType: "loop"
    }}
  >
    <Loader2 className={`h-${size/4} w-${size/4}`} />
  </motion.div>
)

// Google Icon Component
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      fill="currentColor"
    />
  </svg>
)

interface LoginFormProps extends Omit<React.ComponentProps<"div">,
  "onDrag" | "onDragStart" | "onDragEnd" |
  "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" |
  "onTransitionEnd" | "onTransitionStart"
> {
  className?: string;
}

export function LoginForm({
  className,
  ...props
}: LoginFormProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const signInWithGoogle = async () => {
    setIsGoogleLoading(true)

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      })
    } catch (err) {
      console.error("Google sign-in failed:", err)

      let message = "Gagal masuk dengan Google. Silakan coba lagi."

      if (err instanceof Error && err.message) {
        message = err.message
      } else if (typeof err === "string") {
        message = err
      }

      toast.error(message)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const onSubmit = async (values: FormData) => {
    startTransition(async () => {
      try {
        const result = await signInAction(values.email, values.password)

        if (result.success) {
          toast.success(result.message)
          router.push("/dashboard")
        } else {
          toast.error(result.message)
        }
      } catch (error: unknown) {
        console.error("Sign-in error:", error)
        toast.error("An unexpected error occurred. Please try again.")
      }
    })
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  const isLoading = isPending || isGoogleLoading

  return (
    <motion.div
      className={cn("flex flex-col gap-6", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 shadow-lg backdrop-blur-sm bg-card/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <CardHeader className="text-center space-y-4 pb-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  Login with your Google account or email
                </CardDescription>
              </motion.div>
            </CardHeader>
          </motion.div>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-4">
                  {/* Google Sign In Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-11 border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                      type="button"
                      onClick={signInWithGoogle}
                      disabled={isLoading}
                    >
                      <AnimatePresence mode="wait">
                        {isGoogleLoading ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2"
                          >
                            <SimpleLoader size={16} />
                            <span>Signing in...</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2"
                          >
                            <GoogleIcon />
                            <span>Continue with Google</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>

                  {/* Divider */}
                  <motion.div
                    variants={itemVariants}
                    className="relative my-6"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground font-medium">
                        Or continue with email
                      </span>
                    </div>
                  </motion.div>

                  {/* Email Field */}
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email</FormLabel>
                          <FormControl>
                            <motion.div
                              whileFocus={{ scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Input
                                placeholder="Enter your email"
                                className="h-11 border-border/50 focus:border-primary/50 transition-colors duration-300"
                                {...field}
                                disabled={isLoading}
                              />
                            </motion.div>
                          </FormControl>
                          <AnimatePresence>
                            {form.formState.errors.email && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <FormMessage />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Password Field */}
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-medium">Password</FormLabel>
                            <motion.button
                              type="button"
                              onClick={() => router.push("/forgot-password")}
                              className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors duration-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Forgot password?
                            </motion.button>
                          </div>
                          <FormControl>
                            <motion.div
                              whileFocus={{ scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                              className="relative"
                            >
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="h-11 pr-10 border-border/50 focus:border-primary/50 transition-colors duration-300"
                                {...field}
                                disabled={isLoading}
                              />
                              <motion.button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <AnimatePresence mode="wait">
                                  {showPassword ? (
                                    <motion.div
                                      key="hide"
                                      initial={{ opacity: 0, rotate: -90 }}
                                      animate={{ opacity: 1, rotate: 0 }}
                                      exit={{ opacity: 0, rotate: 90 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <EyeOff className="h-4 w-4" />
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      key="show"
                                      initial={{ opacity: 0, rotate: -90 }}
                                      animate={{ opacity: 1, rotate: 0 }}
                                      exit={{ opacity: 0, rotate: 90 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.button>
                            </motion.div>
                          </FormControl>
                          <AnimatePresence>
                            {form.formState.errors.password && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <FormMessage />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isLoading}
                    >
                      <AnimatePresence mode="wait">
                        {isPending ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                            >
                              <Loader2 className="h-4 w-4" />
                            </motion.div>
                            <span>Signing in...</span>
                          </motion.div>
                        ) : (
                          <motion.span
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="font-medium"
                          >
                            Sign In
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Terms and Privacy */}
      <motion.div
        variants={itemVariants}
        className="text-center text-xs text-balance text-muted-foreground"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          By clicking continue, you agree to our{" "}
          <motion.a
            href="/terms"
            className="underline underline-offset-4 hover:text-primary transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Terms of Service
          </motion.a>{" "}
          and{" "}
          <motion.a
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Privacy Policy
          </motion.a>
          .
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
