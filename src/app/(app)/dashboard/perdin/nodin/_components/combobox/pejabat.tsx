"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Pencil, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from "@/components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { deletePejabatAction, listPejabat, upsertPejabat } from "@/server/perdin/utils/pejabat";

type Item = { id: string; nama: string; nip: string | null; jabatan: string; unit: string | null };

export function PejabatCombobox({ value, onChange }: { value?: string; onChange: (id?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  async function refresh() {
    const rows = await listPejabat();
    setItems(rows as Item[]);
  }
  useEffect(() => { refresh(); }, []);

  const selected = items.find(i => i.id === value);

  // modal tambah/edit
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ nama: "", nip: "", jabatan: "", unit: "" });

  function openAdd() {
    setEditing(null);
    setForm({ nama: "", nip: "", jabatan: "", unit: "" });
    setEditOpen(true);
  }
  function openEdit(it: Item) {
    setEditing(it);
    setForm({ nama: it.nama, nip: it.nip ?? "", jabatan: it.jabatan, unit: it.unit ?? "" });
    setEditOpen(true);
  }

  async function save() {
    const res = await upsertPejabat({
      id: editing?.id,
      nama: form.nama,
      nip: form.nip,
      jabatan: form.jabatan,
      unit: form.unit,
    });
    if (res?.ok) {
      toast.success(editing ? "Pejabat diperbarui" : "Pejabat ditambahkan");
      setEditOpen(false);
      await refresh();
    }
  }

  async function del(id: string) {
    await deletePejabatAction(id);
    toast.success("Pejabat dihapus");
    await refresh();
    if (value === id) onChange(undefined);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selected ? `${selected.nama} — ${selected.jabatan}` : "Pilih pejabat..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Cari pejabat..." />
            <CommandEmpty>Tidak ada data.</CommandEmpty>
            <CommandGroup>
              {items.map((it) => (
                <CommandItem
                  key={it.id}
                  onSelect={() => { onChange(it.id); setOpen(false); }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="truncate">{it.nama}</div>
                    <div className="truncate text-xs text-muted-foreground">{it.jabatan}{it.unit ? ` • ${it.unit}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(it); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); del(it.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Check className={cn("h-4 w-4", it.id === value ? "opacity-100" : "opacity-0")} />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <div className="p-2">
              <Button size="sm" className="w-full" onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Tambah Pejabat</Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Pejabat" : "Tambah Pejabat"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm">Nama</label>
              <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">NIP</label>
              <Input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Jabatan</label>
              <Input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Unit (opsional)</label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button onClick={save}>{editing ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
