'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormField, FormItem,
  FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createPegawai } from '@/server/settings/pegawai';


const FormSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  nip: z.string().regex(/^\d{18}$/, 'NIP harus 18 digit angka'),
  pangkat: z.string().min(1, 'Pangkat wajib diisi'),
  golongan: z.string().min(1, 'Golongan wajib diisi'),
  jabatan: z.string().min(1, 'Jabatan wajib diisi'),
});

type FormValues = z.infer<typeof FormSchema>;

export function AddPegawaiDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { nama: '', nip: '', pangkat: '', golongan: '', jabatan: '' },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const res = await createPegawai(values);
      if (res.ok) {
        toast.success('Pegawai berhasil ditambahkan');
        form.reset();
        setOpen(false);
        router.refresh(); // segarkan UI client setelah revalidatePath di server
      } else {
        if ('field' in res && res.field) {
          form.setError(res.field as keyof FormValues, { message: res.message });
        } else {
          toast.error(res.message ?? 'Gagal menyimpan pegawai');
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add Pegawai</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Pegawai</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap" {...field} />
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
                    <Input placeholder="18 digit" inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              <FormField
                control={form.control}
                name="pangkat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pangkat/Gol</FormLabel>
                    <FormControl>
                      <Input placeholder="mis. Penata Muda" {...field} />
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
                      <Input placeholder="mis. III/a" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jabatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jabatan</FormLabel>
                    <FormControl>
                      <Input placeholder="mis. Analis Kepegawaian" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
