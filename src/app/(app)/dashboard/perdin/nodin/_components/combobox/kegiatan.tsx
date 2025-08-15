"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandItem, CommandGroup, CommandInput, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { KegiatanRow, listKegiatanLevel } from "@/server/perdin/utils/kegiatan";


type Props = {
  level: 5 | 6;
  value?: string;                // kode terpilih (mis. "5.02.02.2.03")
  onChange: (v?: string) => void;
};

type KegiatanOption = Pick<KegiatanRow, "kode" | "nama">;

export default function KegiatanCombobox({ level, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<KegiatanOption[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await listKegiatanLevel(level); // Promise<KegiatanRow[]>
      if (mounted) {
        // hanya ambil field yang dibutuhkan di UI
        setItems(rows.map(({ kode, nama }) => ({ kode, nama })));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [level]);

  const selected = items.find((i) => i.kode === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between" role="combobox" aria-expanded={open}>
          {selected ? (
            <span className="truncate">
              <span className="font-mono">{selected.kode}</span> — {selected.nama}
            </span>
          ) : (
            `Pilih ${level === 5 ? "Kegiatan" : "Sub Kegiatan"}`
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={`Cari ${level === 5 ? "kegiatan" : "sub kegiatan"}...`} />
          <CommandEmpty>Tidak ada data.</CommandEmpty>
          <CommandGroup>
            {items.map((it) => (
              <CommandItem
                key={it.kode}
                onSelect={() => {
                  onChange(it.kode);
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", it.kode === value ? "opacity-100" : "opacity-0")} />
                <span className="font-mono">{it.kode}</span>
                <span className="ml-2 truncate">{it.nama}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
