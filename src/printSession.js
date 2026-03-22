const printSessions = new Map();

function createPrintSession(userId) {
  const data = {
    mode: 'cetak',
    step: 'pegawai_nama',
    data: {
      pegawai: {
        nama: '',
        nip: '',
        jabatan: '',
        unitOrganisasi: '',
        unitKerja: '',
      },
      atasan: {
        nama: '',
        nip: '',
        jabatan: '',
        unitOrganisasi: '',
        unitKerja: '',
      },
      analisis: {
        kekuatan: '',
        kelemahan: '',
      },
      jabatanAwal: '',
      level: '',
      nomenklatur: '',
      target: [
        {
          namaKompetensi: 'Kompetensi Teknis',
          unitKompetensi: '',
          level: '',
          indikator: '',
        },
        {
          namaKompetensi: 'Kompetensi Manajerial',
          unitKompetensi: '',
          level: '',
          indikator: '',
        },
        {
          namaKompetensi: 'Kompetensi Sosial Kultural',
          unitKompetensi: '',
          level: '',
          indikator: '',
        },
      ],
      tanggalDiskusi: '',
    },
    options: {
      teknis: [],
      manajerial: [],
      sosial: [],
    },
  };

  printSessions.set(userId, data);
  return data;
}

function getPrintSession(userId) {
  return printSessions.get(userId);
}

function clearPrintSession(userId) {
  printSessions.delete(userId);
}

module.exports = {
  createPrintSession,
  getPrintSession,
  clearPrintSession,
};