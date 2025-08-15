export type DestinasiRow = {
  id: string;
  nama: string;
};

export type KegiatanRow = {
  id: string;
  kode: string;
  nama: string;
  level: 5 | 6;
};

export type PejabatRow = {
  id: string;
  nama: string;
  nip: string | null;
  jabatan: string;
  unit: string | null;
};
