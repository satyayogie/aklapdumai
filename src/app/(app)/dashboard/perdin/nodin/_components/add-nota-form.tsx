"use client"

import * as React from "react"
import { useTransition } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Users,
  Building2,
  Stamp,
  Calendar,
  FileText,
  Mail,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PejabatCombobox } from "./combobox/pejabat"
import { DestinasiComboboxWrapper as DestinasiCombobox } from "./combobox/destinasi-wrapper";
import { PegawaiSelect } from "./pegawai-select"
import KegiatanCombobox from "./combobox/kegiatan"
import { createNotaDraft } from "@/server/perdin/preview"

// Enhanced schema with better validation
const FormSchema = z.object({
  // Required fields
  nomor: z.string()
    .min(1, "Nomor wajib diisi")
    .max(3, "Nomor maksimal 3 digit")
    .regex(/^\d{3}$/, "Nomor harus 3 digit angka"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  tembusan: z.string().min(1, "Tembusan wajib diisi").max(100, "Tembusan terlalu panjang"),
  sifat: z.string().min(1, "Sifat wajib diisi").max(50, "Sifat terlalu panjang"),
  lampiran: z.string().min(1, "Lampiran wajib diisi").max(100, "Lampiran terlalu panjang"),
  hal: z.string().min(1, "Hal wajib diisi").max(200, "Hal terlalu panjang"),
  tujuanIds: z.array(z.string().uuid()).min(1, "Minimal pilih 1 tujuan"),
  pesertaPegawaiIds: z.array(z.string().uuid()).min(1, "Minimal pilih 1 peserta"),
  sameSignerAsDari: z.boolean(),

  // Optional fields
  ythPejabatId: z.string().uuid().optional(),
  dariPejabatId: z.string().uuid().optional(),
  penandatanganPejabatId: z.string().uuid().optional(),
  maksud: z.string().max(1000, "Maksud terlalu panjang").optional(),
  kegiatanKode: z.string().optional(),
  subKegiatanKode: z.string().optional(),
})

type FormValues = z.infer<typeof FormSchema>

export function AddNotaForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Simplified form setup without custom hook
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    defaultValues: {
      nomor: "",
      tanggal: new Date().toISOString().slice(0, 10),
      tembusan: "Bendahara Pengeluaran",
      sifat: "Segera",
      lampiran: "1 (satu) Berkas",
      hal: "Permohonan Perjalanan Dinas",
      tujuanIds: [],
      pesertaPegawaiIds: [],
      sameSignerAsDari: true,
      maksud: "",
      kegiatanKode: "",
      subKegiatanKode: "",
      ythPejabatId: undefined,
      dariPejabatId: undefined,
      penandatanganPejabatId: undefined,
    },
  })

  // Watch for form completion percentage
  const watchedFields = form.watch()
  const completionPercentage = React.useMemo(() => {
    const requiredFields = ['nomor', 'tanggal', 'tembusan', 'sifat', 'lampiran', 'hal']
    const filledRequired = requiredFields.filter(field =>
      watchedFields[field as keyof FormValues] &&
      (watchedFields[field as keyof FormValues] as string).length > 0
    ).length

    const hasDestinations = watchedFields.tujuanIds.length > 0
    const hasPeserta = watchedFields.pesertaPegawaiIds.length > 0

    return Math.round(((filledRequired + (hasDestinations ? 1 : 0) + (hasPeserta ? 1 : 0)) / 8) * 100)
  }, [watchedFields])

  // Watch for changes to sync penandatangan dengan dari
  React.useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === "dariPejabatId" || name === "sameSignerAsDari") {
        const { dariPejabatId, sameSignerAsDari } = form.getValues()
        if (sameSignerAsDari) {
          form.setValue("penandatanganPejabatId", dariPejabatId)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Handler untuk preview - buat draft dan redirect ke preview
  async function onPreview(values: FormValues) {
    startTransition(async () => {
      try {
        // PERBAIKAN: Hanya format nomor 3 digit saja, jangan tambahkan prefix
        const draftPayload = {
          ...values,
          nomor: values.nomor.padStart(3, '0'), // Hanya simpan 3 digit, misal: "112"
        };

        const draftId = await createNotaDraft(draftPayload);
        router.push(`/dashboard/perdin/nodin/preview/${draftId}`);
        toast.success("Draft berhasil dibuat, menuju preview...");
      } catch (error) {
        console.error("Error creating draft:", error);
        toast.error("Gagal membuat draft untuk preview");
      }
    });
  }

  const steps = [
    { id: 1, name: "Informasi Dasar", icon: FileText },
    { id: 2, name: "Tujuan & Peserta", icon: Users },
    { id: 3, name: "Detail & Penandatangan", icon: Stamp }
  ]

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-white/80 to-blue-50/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Progress Pengisian</h3>
                <p className="text-sm text-muted-foreground">
                  {completionPercentage}% selesai
                </p>
              </div>
            </div>
            <Badge
              variant={completionPercentage >= 75 ? "default" : "secondary"}
              className="px-3 py-1"
            >
              {completionPercentage >= 75 ? (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-1" />
              )}
              {completionPercentage}%
            </Badge>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {completionPercentage >= 75 && (
            <div className="mt-3 text-center">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Siap untuk preview! Isi form sudah cukup lengkap.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step Indicator */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                  ${completionPercentage >= (step.id * 25)
                    ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'border-gray-300 bg-white dark:bg-slate-800 text-gray-400'
                  }
                `}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="ml-3 hidden md:block">
                  <div className={`text-sm font-medium ${completionPercentage >= (step.id * 25) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                    {step.name}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-b">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            Form Nota Dinas
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onPreview)} className="space-y-8">

              {/* Step 1: Header Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">Informasi Dasar</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nomor"
                    render={({ field }) => (
                      <FormItem className="group">
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          Nomor Nota Dinas *
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <span className="bg-gray-100 px-3 py-2 border border-r-0 rounded-l-md text-sm">
                              090/ND/
                            </span>
                            <Input
                              placeholder="112"
                              className="rounded-l-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              maxLength={3}
                              {...field}
                              onChange={(e) => {
                                // Pastikan hanya angka dan maksimal 3 digit
                                const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                                field.onChange(value);
                              }}
                            />
                            <span className="bg-gray-100 px-3 py-2 border border-l-0 rounded-r-md text-sm">
                              /BPKAD
                            </span>
                          </div>
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Format otomatis: 090/ND/{field.value.padStart(3, '0') || "XXX"}/BPKAD
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tanggal"
                    render={({ field }) => (
                      <FormItem className="group">
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          Tanggal *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ythPejabatId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-green-500" />
                          Kepada (Yth)
                        </FormLabel>
                        <PejabatCombobox value={field.value} onChange={field.onChange} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dariPejabatId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-500" />
                          Dari
                        </FormLabel>
                        <PejabatCombobox value={field.value} onChange={field.onChange} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="sifat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Sifat *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Segera"
                            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lampiran"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Lampiran *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1 (satu) Berkas"
                            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tembusan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Tembusan *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Bendahara Pengeluaran"
                            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="hal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Hal *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Permohonan Perjalanan Dinas"
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-8" />

              {/* Step 2: Content */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">Konten & Peserta</h3>
                </div>

                {/* Preview pembuka */}
                <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/20">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm">
                    <span className="font-medium">Preview Pembuka:</span><br />
                    Dengan hormat, Bersamaan dengan ini disampaikan kepada Bapak
                    Usulan <span className="font-semibold text-blue-600">{form.watch("hal") || "..."}</span> dengan catatan sebagai berikut:
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="maksud"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Maksud Perjalanan Dinas</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Dalam rangka pengambilan Dokumen Hasil Evaluasi Gubernur tentang Ranperda Kota Dumai tentang Pertanggungjawaban Pelaksanaan APBD..."
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Uraikan dengan jelas maksud perjalanan dinas</span>
                        <span>{field.value?.length || 0}/1000</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tujuan */}
                <div className="space-y-3">
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-500" />
                    Tujuan Perjalanan *
                  </FormLabel>
                  <DestinasiCombobox
                    values={form.watch("tujuanIds")}
                    onChange={(vals) => form.setValue("tujuanIds", vals)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Pilih satu atau beberapa tujuan perjalanan dinas
                  </div>
                </div>

                {/* Peserta */}
                <div className="space-y-3">
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    Peserta Perjalanan (Atas Nama) *
                  </FormLabel>
                  <PegawaiSelect
                    values={form.watch("pesertaPegawaiIds")}
                    onChange={(vals) => form.setValue("pesertaPegawaiIds", vals)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Pilih pegawai yang akan melakukan perjalanan dinas
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Step 3: Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                    <Stamp className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">Detail & Penandatangan</h3>
                </div>

                {/* PERBAIKAN: Kegiatan & Subkegiatan dengan spacing yang cukup */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="kegiatanKode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Kegiatan (Level 5)</FormLabel>
                        <div className="relative">
                          <KegiatanCombobox level={5} value={field.value} onChange={field.onChange} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Spacer untuk memastikan dropdown tidak overlap */}
                  <div className="h-2" />

                  <FormField
                    control={form.control}
                    name="subKegiatanKode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Sub Kegiatan (Level 6)</FormLabel>
                        <div className="relative">
                          <KegiatanCombobox level={6} value={field.value} onChange={field.onChange} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Spacer untuk dropdown */}
                <div className="h-8"></div>

                {/* Penandatangan */}
                <div className="space-y-4">
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Stamp className="h-4 w-4 text-indigo-500" />
                    Penandatangan Dokumen
                  </FormLabel>

                  <Card className="border border-dashed border-gray-300 dark:border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Sama dengan pengirim (Dari)</div>
                          <div className="text-xs text-muted-foreground">
                            Penandatangan otomatis sama dengan yang tercantum di field (Dari)
                          </div>
                        </div>
                        <FormField
                          control={form.control}
                          name="sameSignerAsDari"
                          render={({ field }) => (
                            <FormItem className="m-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-blue-500"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {!form.watch("sameSignerAsDari") && (
                    <FormField
                      control={form.control}
                      name="penandatanganPejabatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Pilih Penandatangan</FormLabel>
                          <PejabatCombobox value={field.value} onChange={field.onChange} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Preview Button */}
              <div className="flex justify-end gap-4 pt-8 border-t">
                <Button
                  type="submit"
                  disabled={pending || completionPercentage < 75}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {pending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                      Membuat Preview...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Nota Dinas
                    </>
                  )}
                </Button>
              </div>

              {/* Progress requirement notice */}
              {completionPercentage < 75 && (
                <div className="text-center">
                  <Alert className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/20 max-w-md mx-auto">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
                      Lengkapi minimal 75% form untuk melanjutkan ke preview
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
