"use client";

import React, { useMemo } from "react";
import { NotaFormResolved } from "@/server/perdin/preview";
import Image from "next/image";
import "./styles/print.css";

interface NotaPreviewProps {
  data: NotaFormResolved;
  mode?: "preview" | "print";
}

function formatTanggalLengkap(tanggalISO: string): string {
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const date = new Date(tanggalISO);
  const day = date.getDate();
  const month = bulan[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

function generateNomorOtomatis(inputNomor: string): string {
  return `090/ND/${inputNomor}/BPKAD`;
}

export function NotaPreview({ data, mode = "preview" }: NotaPreviewProps) {
  const processedData = useMemo(() => {
    console.log("NotaPreview processing data:", data);

    const ythPejabat = data.ythPejabat || {
      nama: "KEPALA BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH",
      jabatan: "Kepala Badan"
    };

    const dariPejabat = data.dariPejabat || {
      nama: "[PEJABAT BELUM DIPILIH]",
      jabatan: "[JABATAN BELUM DIPILIH]"
    };

    const penandatanganPejabat = data.penandatanganPejabat ||
      (data.sameSignerAsDari ? dariPejabat : dariPejabat);

    const tujuanList = data.tujuanList.length > 0
      ? data.tujuanList.map(t => t.nama)
      : ["[TUJUAN BELUM DIPILIH]"];

    const pesertaList = data.pesertaList.length > 0
      ? data.pesertaList
      : [{
          id: "placeholder",
          nama: "[PEGAWAI BELUM DIPILIH]",
          nip: "000000000000000000",
          pangkat: "-",
          golongan: "-",
          jabatan: "[JABATAN BELUM DIPILIH]"
        }];

    const nomorLengkap = generateNomorOtomatis(data.nomor.padStart(3, '0'));

    return {
      ythPejabat,
      dariPejabat,
      penandatanganPejabat,
      tujuanList,
      pesertaList,
      nomorLengkap
    };
  }, [data]);

  return (
    <div className="print-document">
      {/* Header dengan Logo dan Kop Surat - RAPAT KE ATAS */}
      <div className="document-header">
        <div className="header-content">
          <div className="header-logo">
            <Image
              src="/img/logo.png"
              alt="Logo Kota Dumai"
              width={42}
              height={50}
              className="logo-print"
              priority
            />
          </div>

          <div className="header-text">
            <div className="header-title-main">PEMERINTAH KOTA DUMAI</div>
            <div className="header-title-sub">BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH</div>
            <div className="header-address">
              Jalan Tuanku Tambusai, Bagan Besar, Bukit Kapur, Dumai, Riau 28882<br />
              Laman www.bpkad.dumaikota.go.id
            </div>
          </div>
        </div>

        <div className="header-border"></div>
      </div>

      {/* Content Area */}
      <div className="document-content">
        {/* Judul Nota Dinas - LEBIH DEKAT KE GARIS */}
        <div className="document-title">
          <h1>NOTA DINAS</h1>
        </div>

        {/* Header Info - SPASI DIKURANGI */}
        <div className="header-info">
          <table className="info-table border-b-black border-b-1">
            <tbody>
              <tr>
                <td className="label">Yth.</td>
                <td className="colon">:</td>
                <td className="value">{processedData.ythPejabat.jabatan}</td>
              </tr>
              <tr>
                <td className="label">Dari</td>
                <td className="colon">:</td>
                <td className="value">{processedData.dariPejabat.jabatan}</td>
              </tr>
              <tr>
                <td className="label">Tembusan</td>
                <td className="colon">:</td>
                <td className="value">{data.tembusan}</td>
              </tr>
              <tr>
                <td className="label">Tanggal</td>
                <td className="colon">:</td>
                <td className="value">{formatTanggalLengkap(data.tanggal)}</td>
              </tr>
              <tr>
                <td className="label">Nomor</td>
                <td className="colon">:</td>
                <td className="value">{processedData.nomorLengkap}</td>
              </tr>
              <tr>
                <td className="label">Sifat</td>
                <td className="colon">:</td>
                <td className="value">{data.sifat}</td>
              </tr>
              <tr>
                <td className="label">Lampiran</td>
                <td className="colon">:</td>
                <td className="value">{data.lampiran}</td>
              </tr>
              <tr>
                <td className="label">Hal</td>
                <td className="colon">:</td>
                <td className="value bold">{data.hal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pembuka */}
        <div className="opening">
          <p>Dengan hormat,</p>
          <p className="indent">
            Bersamaan dengan ini disampaikan kepada Bapak Usulan {data.hal}
            {processedData.tujuanList.length > 0 && ` ke ${processedData.tujuanList[0]}`} dengan catatan sebagai berikut:
          </p>
        </div>

        {/* Tabel Utama - STRUKTUR DIPERBAIKI */}
        <div className="main-table-container">
          <table className="main-table">
            <tbody>
              {/* Maksud */}
              <tr>
                <td className="main-label">Maksud</td>
                <td className="main-colon">:</td>
                <td className="main-value">
                  {data.maksud || "Dalam rangka pengambilan Dokumen Hasil Evaluasi Gubernur tentang Ranperda Kota Dumai tentang Pertanggungjawaban Pelaksanaan APBD dan Ranperkada tentang Penjabaran Pertanggungjawaban APBD Kota Dumai T.A 2024."}
                </td>
              </tr>

              {/* Tujuan */}
              <tr>
                <td className="main-label">Tujuan</td>
                <td className="main-colon">:</td>
                <td className="main-value">
                  {processedData.tujuanList.length > 1
                    ? processedData.tujuanList.join(", ")
                    : processedData.tujuanList[0]}
                </td>
              </tr>

              {/* PERBAIKAN: Atas Nama ditulis dalam baris terpisah */}
              <tr>
                <td className="main-label">Atas Nama</td>
                <td className="main-colon">:</td>
                <td className="main-value">
                  {/* Kosongkan atau bisa diisi dengan keterangan singkat */}
                </td>
              </tr>
            </tbody>
          </table>

          {/* PERBAIKAN: Tabel Peserta dipindah ke luar, di bawah tabel utama */}
          <div className="peserta-table-wrapper">
            <table className="peserta-table">
              <thead>
                <tr>
                  <th className="peserta-no">No</th>
                  <th className="peserta-nama">Nama/NIP</th>
                  <th className="peserta-pangkat">Pangkat/Gol</th>
                  <th className="peserta-jabatan">Jabatan</th>
                </tr>
              </thead>
              <tbody>
                {processedData.pesertaList.map((peserta, index) => (
                  <tr key={peserta.id || index}>
                    <td className="peserta-no">{index + 1}.</td>
                    <td className="peserta-nama">
                      <div className="nama-line">{peserta.nama}</div>
                      <div className="nip-line">NIP. {peserta.nip}</div>
                    </td>
                    <td className="peserta-pangkat">
                      <div>{peserta.pangkat}</div>
                      <div>({peserta.golongan})</div>
                    </td>
                    <td className="peserta-jabatan">{peserta.jabatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Biaya Perjalanan */}
        <div className="biaya-section">
          <p className="biaya-title">Biaya Perjalanan Dinas ini dibebankan Pada:</p>
          <table className="biaya-table">
            <tbody>
              <tr>
                <td className="biaya-label">Kegiatan</td>
                <td className="biaya-colon">:</td>
                <td className="biaya-kode">{data.kegiatanKode || "-"}</td>
                <td className="biaya-colon">:</td>
                <td className="biaya-nama">{data.kegiatanData?.nama || "Koordinasi dan Pelaksanaan Akuntansi dan Pelaporan Keuangan Daerah"}</td>
              </tr>
              <tr>
                <td className="biaya-label">Sub Kegiatan</td>
                <td className="biaya-colon">:</td>
                <td className="biaya-kode">{data.subKegiatanKode || "-"}</td>
                <td className="biaya-colon">:</td>
                <td className="biaya-nama">{data.subKegiatanData?.nama || "Koordinasi dan Penyusunan Rancangan Peraturan Daerah tentang Pertanggungjawaban Pelaksanaan APBD Kabupaten/Kota"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Penutup */}
        <div className="closing">
          <p className="indent">
            Demikian disampaikan, pertimbangan selanjutnya diserahkan kepada Bapak, terima kasih.
          </p>
        </div>
      </div>

      {/* Footer - Area Tanda Tangan */}
      <div className="document-footer">
        <div className="signature-container">
          {/* Kolom Disposisi */}
          <div className="disposisi-column">
            <table className="disposisi-table">
              <thead>
                <tr>
                  <th>Kolom Disposisi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="disposisi-content-cell">
                    {/* Kosong untuk disposisi manual */}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kolom Tanda Tangan */}
          <div className="signature-column">
            <div className="signature-text">{processedData.penandatanganPejabat.jabatan},</div>
            <div className="signature-space"></div>
            <div className="signer-name">{processedData.penandatanganPejabat.nama}</div>
            {processedData.penandatanganPejabat.nip && (
              <div className="signer-nip">NIP. {processedData.penandatanganPejabat.nip}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
