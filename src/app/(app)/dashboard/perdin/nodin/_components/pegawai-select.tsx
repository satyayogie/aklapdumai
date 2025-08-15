"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandItem, CommandGroup, CommandInput, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronsUpDown, Trash2 } from "lucide-react";
import { listPegawai, PegawaiRow } from "@/server/perdin/utils/pegawai";

export function PegawaiSelect({ values, onChange }: { values: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PegawaiRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data pegawai dari server action
  useEffect(() => {
    (async () => {
      try {
        const pegawaiData = await listPegawai();
        setItems(pegawaiData);
      } catch (error) {
        console.error("Gagal memuat data pegawai:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function add(id: string) {
    if (!values.includes(id)) onChange([...values, id]);
  }
  function remove(id: string) {
    onChange(values.filter(v => v !== id));
  }

  // Helper function to get pegawai name by id
  function getPegawaiById(id: string) {
    return items.find(item => item.id === id);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        {values.map((id) => {
          const pegawai = getPegawaiById(id);
          return (
            <div key={id} className="flex items-center gap-2">
              <div className="flex-1 rounded-md border px-3 py-2 text-sm bg-muted/40">
                {pegawai ? (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{pegawai.nama}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {pegawai.nip} • {pegawai.jabatan}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Loading...</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => remove(id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between w-full" disabled={loading}>
            {loading ? "Loading pegawai..." : "Tambah pegawai…"}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Cari pegawai..." />
            <CommandEmpty>
              {loading ? "Memuat data..." : "Tidak ada data pegawai."}
            </CommandEmpty>
            <CommandGroup>
              {items
                .filter(item => !values.includes(item.id)) // Hide already selected
                .map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    add(item.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{item.nama}</span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono shrink-0">
                        {item.nip}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.pangkat} • {item.golongan} • {item.jabatan}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
