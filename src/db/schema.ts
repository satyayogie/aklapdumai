import {
  pgTable, text, timestamp, boolean, varchar, uuid, integer,
  uniqueIndex, index, check, date, pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";


export const notaStatusEnum = pgEnum("nota_status", [
  "DRAFT", "CETAK",
]);


export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // DB-level default lebih stabil dari $defaultFn
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()) // ORM-level auto update
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (t) => ({
  // cepatkan lookup sesi per user
  sessionUserIdx: index("session_user_idx").on(t.userId),
}));

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => ({
  // kombinasi provider + account harus unik (penting untuk OAuth)
  accountProviderAccountUnique: uniqueIndex("account_provider_account_unique")
    .on(t.providerId, t.accountId),
  accountUserIdx: index("account_user_idx").on(t.userId),
}));

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => ({
  verificationIdx: index("verification_idx").on(t.identifier, t.value),
}));

export const pegawai = pgTable(
  "pegawai",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nama: text("nama").notNull(),
    nip: varchar("nip", { length: 18 }).notNull(),
    pangkat: varchar("pangkat", { length: 20 }).notNull(),
    golongan: varchar("golongan", { length: 5 }).notNull(),
    jabatan: varchar("jabatan", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    nipUnique: uniqueIndex("pegawai_nip_unique").on(t.nip),
    namaIdx: index("pegawai_nama_idx").on(t.nama),
    // Validasi NIP 18 digit (gunakan import `sql`)
    nipDigitsCheck: check("pegawai_nip_digits_check", sql`${t.nip} ~ '^[0-9]{18}$'`),
  })
);

export const pejabat = pgTable("pejabat", {
  id: uuid("id").defaultRandom().primaryKey(),
  nama: varchar("nama", { length: 150 }).notNull(),
  nip: varchar("nip", { length: 21 }),             // contoh format “1976… 2 005”, fleksibel
  jabatan: varchar("jabatan", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 255 }),          // opsional
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => ({
  namaIdx: index("pejabat_nama_idx").on(t.nama),
}));

// Destinasi (Tujuan perjalanan, ex: "Kantor BPKAD Provinsi Riau")
export const destinasi = pgTable("destinasi", {
  id: uuid("id").defaultRandom().primaryKey(),
  nama: varchar("nama", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => ({
  destNamaIdx: index("dest_nama_idx").on(t.nama),
}));

// Kegiatan referensi (kode & level)
export const kegiatanRef = pgTable("kegiatan_ref", {
  id: uuid("id").defaultRandom().primaryKey(),
  kode: varchar("kode", { length: 50 }).notNull(), // ex: 5.02.02.2.03 atau 5.02.02.2.03.0005
  nama: varchar("nama", { length: 255 }).notNull(),
  level: integer("level").notNull(),               // 5 untuk kegiatan, 6 untuk subkegiatan
}, (t) => ({
  kodeUnique: uniqueIndex("kegiatan_kode_unique").on(t.kode),
  levelIdx: index("kegiatan_level_idx").on(t.level),
}));

// Nota Dinas: tambahkan FK ke pejabat (yth/dari/penandatangan) + field header
export const notaDinas = pgTable("nota_dinas", {
  id: uuid("id").defaultRandom().primaryKey(),
  nomor: varchar("nomor", { length: 64 }).notNull(),
  tanggal: date("tanggal").notNull(),
  ythPejabatId: uuid("yth_pejabat_id").references(() => pejabat.id),
  dariPejabatId: uuid("dari_pejabat_id").references(() => pejabat.id),
  tembusan: varchar("tembusan", { length: 255 }).default("Bendahara Pengeluaran").notNull(),
  sifat: varchar("sifat", { length: 50 }).default("Segera").notNull(),
  lampiran: varchar("lampiran", { length: 100 }).default("1 (satu) Berkas").notNull(),
  hal: varchar("hal", { length: 255 }).default("Permohonan Perjalanan Dinas").notNull(),

  // isi
  maksud: text("maksud"),
  // tujuan lokasi dipilih dari 'destinasi' via tabel relasi di bawah

  // kegiatan (lvl 5) & subkegiatan (lvl 6) disimpan sebagai kode
  kegiatanKode: varchar("kegiatan_kode", { length: 50 }),
  subKegiatanKode: varchar("sub_kegiatan_kode", { length: 50 }),

  // penandatangan (biasanya sama dengan Dari)
  penandatanganPejabatId: uuid("penandatangan_pejabat_id").references(() => pejabat.id),

  status: notaStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => ({
  nomorUnique: uniqueIndex("nota_nomor_unique").on(t.nomor),
  tanggalIdx: index("nota_tanggal_idx").on(t.tanggal),
}));

// Peserta (Atas Nama): relasi Nota x Pegawai
export const notaPeserta = pgTable("nota_peserta", {
  id: uuid("id").defaultRandom().primaryKey(),
  notaId: uuid("nota_id").notNull().references(() => notaDinas.id, { onDelete: "cascade" }),
  pegawaiId: uuid("pegawai_id").notNull().references(() => pegawai.id),
  noUrut: integer("no_urut").default(1).notNull(),
}, (t) => ({
  idxNotaUrut: index("nota_peserta_nota_urut_idx").on(t.notaId, t.noUrut),
}));

// Tujuan (bisa multi): relasi Nota x Destinasi
export const notaTujuan = pgTable("nota_tujuan", {
  id: uuid("id").defaultRandom().primaryKey(),
  notaId: uuid("nota_id").notNull().references(() => notaDinas.id, { onDelete: "cascade" }),
  destinasiId: uuid("destinasi_id").notNull().references(() => destinasi.id),
  noUrut: integer("no_urut").default(1).notNull(),
}, (t) => ({
  idxNotaTujuan: index("nota_tujuan_nota_urut_idx").on(t.notaId, t.noUrut),
}));

export const notaPreviews = pgTable("nota_previews", {
  id: uuid("id").primaryKey().defaultRandom(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// jangan lupa export:
export const schema = {
  user, session, account, verification,
  pegawai, pejabat, destinasi, kegiatanRef,
  notaDinas, notaPeserta, notaTujuan,notaPreviews
};
