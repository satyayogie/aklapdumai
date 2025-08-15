"use client";

import * as React from "react";
import { useMemo, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, MailCheck, MailX, User as UserIcon } from "lucide-react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { deleteUser, updateUser } from "@/server/settings/user";


type Row = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date | string | null;
};

export function UserTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // debounce search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return rows;
    const s = debouncedQuery.toLowerCase();
    return rows.filter((r) =>
      (r.name?.toLowerCase() ?? "").includes(s) ||
      (r.email?.toLowerCase() ?? "").includes(s)
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
      {/* search + info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau email..."
            className="pl-9 border-0 bg-muted/50 focus-visible:bg-background transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary">{filtered.length} user</Badge>
          <div className="text-sm text-muted-foreground">Hal. {safePage} / {totalPages}</div>
        </div>
      </div>

      {/* table */}
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="relative overflow-hidden">
          <div className="max-h-[calc(100vh-240px)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[56px] text-center font-semibold">#</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="min-w-[220px] font-semibold">Email</TableHead>
                  <TableHead className="min-w-[120px] font-semibold text-center">Verified</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">Created</TableHead>
                  <TableHead className="w-[96px] text-right font-semibold pr-4">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((r, i) => (
                    <TableRow key={r.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center text-sm font-medium text-muted-foreground">
                        {(safePage - 1) * pageSize + i + 1}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {r.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
                            ) : (
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{r.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{r.id}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{r.email}</code>
                      </TableCell>

                      <TableCell className="text-center">
                        {r.emailVerified ? (
                          <Badge className="gap-1" variant="secondary">
                            <MailCheck className="h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge className="gap-1" variant="outline">
                            <MailX className="h-3 w-3" /> Pending
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {r.createdAt ? formatDate(r.createdAt) : "—"}
                      </TableCell>

                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <EditUserButton row={r} />
                          <DeleteUserButton id={r.id} name={r.name} />
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

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(safePage - 1)} disabled={safePage <= 1} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Sebelumnya
          </Button>
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const n = safePage <= 3 ? i + 1 : safePage >= totalPages - 2 ? totalPages - 4 + i : safePage - 2 + i;
              if (n < 1 || n > totalPages) return null;
              return (
                <Button key={n} variant={n === safePage ? "default" : "ghost"} size="sm" onClick={() => handlePageChange(n)} className="w-8 h-8 p-0">
                  {n}
                </Button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(safePage + 1)} disabled={safePage >= totalPages} className="gap-1">
            Selanjutnya <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---- utils ---- */
function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" });
}

/* ===== DELETE BUTTON ===== */
function DeleteUserButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = () =>
    startTransition(async () => {
      const res = await deleteUser({ id });
      if (res.ok) {
        toast.success(`User "${name}" dihapus`);
        router.refresh();
      } else {
        toast.error(res.message ?? "Gagal menghapus user");
      }
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label={`Hapus ${name}`}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Hapus</span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus user?</AlertDialogTitle>
          <AlertDialogDescription>
            Data user <b>{name}</b> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} disabled={pending} className="bg-destructive hover:bg-destructive/90">
            {pending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ===== EDIT BUTTON ===== */
const EditFormSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid").max(255),
  image: z.string().url("URL gambar tidak valid").max(1024).optional().or(z.literal("")),
  emailVerified: z.boolean(),
});
type EditFormValues = z.infer<typeof EditFormSchema>;

function EditUserButton({ row }: { row: Row }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      id: row.id,
      name: row.name,
      email: row.email,
      image: row.image ?? "",
      emailVerified: row.emailVerified,
    },
  });

  const onSubmit = (values: EditFormValues) =>
    startTransition(async () => {
      const res = await updateUser(values);
      if (res.ok) {
        toast.success("User diperbarui");
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

  // sinkronkan nilai saat dialog dibuka
  React.useEffect(() => {
    if (open) {
      form.reset({
        id: row.id,
        name: row.name,
        email: row.email,
        image: row.image ?? "",
        emailVerified: row.emailVerified,
      });
    }
  }, [open, row, form]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${row.name}`}
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama user" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@contoh.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailVerified"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="m-0">Email Verified</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
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
