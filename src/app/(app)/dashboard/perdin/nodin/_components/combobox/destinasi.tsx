"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { DestinasiRow } from "@/types/perdin";
import { toast } from "sonner";

type Props = {
  values: string[];
  onChange: (ids: string[]) => void;
  listDestinasi: () => Promise<DestinasiRow[]>;
  upsertDestinasi: (input: { id?: string; nama: string }) => Promise<{ ok: boolean; id?: string; message?: string }>;
  deleteDestinasi: (id: string) => Promise<{ ok: boolean; message?: string }>;
};

export function DestinasiCombobox({
  values,
  onChange,
  listDestinasi,
  upsertDestinasi,
  deleteDestinasi
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DestinasiRow[]>([]);
  const [newName, setNewName] = useState("");

  async function refresh() {
    const rows = await listDestinasi();
    setItems(rows);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const toggle = (id: string) => {
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  };

  // Helper function untuk mendapatkan nama berdasarkan ID
  const getDestinasiName = (id: string): string => {
    const destinasi = items.find(item => item.id === id);
    return destinasi?.nama || `ID: ${id.slice(0, 8)}`;
  };

  const handleDelete = async (id: string, nama: string) => {
    try {
      const result = await deleteDestinasi(id);
      if (result.ok) {
        toast.success(`Destinasi "${nama}" berhasil dihapus`);
        await refresh();
        // Remove from selected values if it was selected
        if (values.includes(id)) {
          onChange(values.filter(v => v !== id));
        }
      } else {
        toast.error(result.message || "Gagal menghapus destinasi");
      }
    } catch (error) {
      console.error("Error deleting destinasi:", error);
      toast.error("Destinasi sedang digunakan dan tidak dapat dihapus");
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {values.length ? `${values.length} tujuan dipilih` : "Pilih / tambah tujuan…"}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <div className="p-2">
            <Command>
              <CommandInput placeholder="Cari tujuan…" />
              <CommandEmpty>Tidak ada data.</CommandEmpty>
              <CommandGroup>
                {items.map((it) => {
                  const selected = values.includes(it.id);
                  return (
                    <CommandItem
                      key={it.id}
                      onSelect={() => toggle(it.id)}
                      className="flex items-center justify-between"
                    >
                      <span className="flex-1 truncate">{it.nama}</span>
                      <div className="flex items-center gap-2 ml-2">
                        {selected && <Badge variant="secondary" className="text-xs">dipilih</Badge>}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(it.id, it.nama);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>

            <div className="mt-2 flex gap-2">
              <input
                className="w-full rounded border px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tambah destinasi…"
                value={newName}
                onChange={(e) => setNewName(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2">
        {values.length === 0 && <span className="text-xs text-muted-foreground">Belum ada tujuan</span>}
        {values.map((id) => (
          <Badge key={id} variant="outline" className="text-xs">
            {getDestinasiName(id)}
          </Badge>
        ))}
      </div>
    </div>
  );

  async function handleAdd() {
    const nama = newName.trim();
    if (!nama) return;

    try {
      const res = await upsertDestinasi({ nama });
      if (res.ok) {
        toast.success(`Destinasi "${nama}" berhasil ditambahkan`);
        setNewName("");
        await refresh();
      } else {
        toast.error(res.message || "Gagal menambahkan destinasi");
      }
    } catch (error) {
      console.error("Error adding destinasi:", error);
      toast.error("Gagal menambahkan destinasi");
    }
  }
}
