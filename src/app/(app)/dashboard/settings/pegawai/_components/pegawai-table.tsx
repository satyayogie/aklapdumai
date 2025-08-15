"use client";

import * as React from "react";
import { useMemo, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent,
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import { deletePegawai, updatePegawai } from "@/server/settings/pegawai";

// sesuaikan path actions-mu

type Row = {
  id: string;
  nama: string;
  nip: string;
  pangkat: string;
  golongan: string;
  jabatan: string;
};

export function PegawaiTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Debounce search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return rows;
    const s = debouncedQuery.toLowerCase();
    return rows.filter((r) =>
      (r.nama?.toLowerCase() ?? "").includes(s) ||
      (r.nip ?? "").includes(debouncedQuery) ||
      (r.jabatan?.toLowerCase() ?? "").includes(s) ||
      (r.pangkat?.toLowerCase() ?? "").includes(s) ||
      (r.golongan?.toLowerCase() ?? "").includes(s)
    );
  }, [rows, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  React.useEffect(() => { setPage(1); }, [debouncedQuery]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(totalPages, newPage)));
  }, [totalPages]);

  return (
    <div className="space-y-6">
      {/* Header pencarian & info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari pegawai..."
            className="pl-9 border-0 bg-muted/50 focus-visible:bg-background transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {filtered.length} pegawai
          </Badge>
          <div className="text-sm text-muted-foreground">
            Hal. {safePage} dari {totalPages}
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="relative overflow-hidden">
          <div className="max-h-[calc(100vh-240px)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[60px] text-center font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Nama Pegawai</TableHead>
                  <TableHead className="min-w-[180px] font-semibold">NIP</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">Pangkat</TableHead>
                  <TableHead className="min-w-[80px] font-semibold text-center">Gol.</TableHead>
                  <TableHead className="min-w-[220px] font-semibold">Jabatan</TableHead>
                  <TableHead className="w-[96px] text-right font-semibold pr-4">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <p className="text-sm font-medium">
                          {debouncedQuery ? "Tidak ada hasil pencarian" : "Belum ada data pegawai"}
                        </p>
                        {debouncedQuery && (
                          <p className="text-xs">Coba gunakan kata kunci yang berbeda</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((r, i) => (
                    <TableRow
                      key={r.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="text-center text-sm font-medium text-muted-foreground">
                        {(safePage - 1) * pageSize + i + 1}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-foreground truncate">{r.nama}</div>
                      </TableCell>

                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {formatNip(r.nip)}
                        </code>
                      </TableCell>

                      <TableCell className="text-sm">{r.pangkat}</TableCell>

                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {r.golongan}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">{r.jabatan}</TableCell>

                      {/* Aksi: tombol ikon kembali seperti sebelumnya */}
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <EditPegawaiButton row={r} />
                          <DeletePegawaiButton id={r.id} name={r.nama} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber =
                safePage <= 3 ? i + 1 :
                safePage >= totalPages - 2 ? totalPages - 4 + i :
                safePage - 2 + i;

              if (pageNumber < 1 || pageNumber > totalPages) return null;

              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === safePage ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="gap-1"
          >
            Selanjutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function formatNip(nip?: string) {
  if (!nip) return "";
  const s = nip.replace(/\D/g, "");
  if (s.length === 18) {
    return `${s.slice(0, 8)} ${s.slice(8, 14)} ${s.slice(14, 15)} ${s.slice(15)}`;
  }
  return nip;
}

/* ====== DELETE BUTTON (ikon) ====== */
function DeletePegawaiButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = () =>
    startTransition(async () => {
      const res = await deletePegawai({ id });
      if (res.ok) {
        toast.success(`${name} berhasil dihapus`);
        router.refresh();
      } else {
        toast.error(res.message ?? "Gagal menghapus pegawai");
      }
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          aria-label={`Hapus ${name}`}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Hapus</span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">Konfirmasi Hapus</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Yakin ingin menghapus data <span className="font-semibold">{name}</span>? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={pending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {pending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ====== EDIT BUTTON (ikon + Dialog) ====== */
const EditFormSchema = z.object({
  id: z.string().uuid(),
  nama: z.string().min(1, "Nama wajib diisi").max(100, "Nama terlalu panjang"),
  nip: z.string().regex(/^\d{18}$/, "NIP harus 18 digit angka"),
  pangkat: z.string().min(1, "Pangkat wajib diisi").max(50, "Pangkat terlalu panjang"),
  golongan: z.string().regex(/^(I|II|III|IV)\/[A-Ea-e]$/, "Format: I/a, II/b, III/c, IV/d, dll"),
  jabatan: z.string().min(1, "Jabatan wajib diisi").max(100, "Jabatan terlalu panjang"),
});
type EditFormValues = z.infer<typeof EditFormSchema>;

function EditPegawaiButton({ row }: { row: Row }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      id: row.id,
      nama: row.nama,
      nip: row.nip,
      pangkat: row.pangkat,
      golongan: row.golongan,
      jabatan: row.jabatan,
    },
  });

  const onSubmit = (values: EditFormValues) =>
    startTransition(async () => {
      const res = await updatePegawai(values);
      if (res.ok) {
        toast.success("Data berhasil diperbarui");
        setOpen(false);
        router.refresh();
      } else {
        if ("field" in res && res.field) {
          form.setError(res.field, { message: res.message });
        } else {
          toast.error(res.message ?? "Gagal menyimpan perubahan");
        }
      }
    });

  // sinkronkan form saat dialog dibuka
  React.useEffect(() => {
    if (open) {
      form.reset({
        id: row.id,
        nama: row.nama,
        nip: row.nip,
        pangkat: row.pangkat,
        golongan: row.golongan,
        jabatan: row.jabatan,
      });
    }
  }, [open, row, form]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${row.nama}`}
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Pegawai</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIP</FormLabel>
                    <FormControl>
                      <Input placeholder="18 digit angka" inputMode="numeric" maxLength={18} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="pangkat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pangkat</FormLabel>
                      <FormControl>
                        <Input placeholder="Penata Tk. I" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="golongan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Golongan</FormLabel>
                      <FormControl>
                        <Input placeholder="III/d" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="jabatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jabatan</FormLabel>
                    <FormControl>
                      <Input placeholder="Analis Kepegawaian" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                  Batal
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
