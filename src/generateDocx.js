const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

function safeFilename(value) {
  return String(value || 'output')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function generateIdpDocx(payload) {
  const templatePath = path.join(
    __dirname,
    '..',
    'templates',
    'template_idp_telegram_bot.docx'
  );

  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    pegawai_nama: payload.pegawai.nama,
    pegawai_nip: payload.pegawai.nip,
    pegawai_jabatan: payload.pegawai.jabatan,
    pegawai_unit_organisasi: payload.pegawai.unitOrganisasi,
    pegawai_unit_kerja: payload.pegawai.unitKerja,

    atasan_nama: payload.atasan.nama,
    atasan_nip: payload.atasan.nip,
    atasan_jabatan: payload.atasan.jabatan,
    atasan_unit_organisasi: payload.atasan.unitOrganisasi,
    atasan_unit_kerja: payload.atasan.unitKerja,

    kekuatan: payload.analisis.kekuatan,
    kelemahan: payload.analisis.kelemahan,

    b1_unit_kompetensi: payload.target[0].unitKompetensi,
    b1_level: payload.target[0].level,
    b1_indikator: payload.target[0].indikator,

    b2_unit_kompetensi: payload.target[1].unitKompetensi,
    b2_level: payload.target[1].level,
    b2_indikator: payload.target[1].indikator,

    b3_unit_kompetensi: payload.target[2].unitKompetensi,
    b3_level: payload.target[2].level,
    b3_indikator: payload.target[2].indikator,

    c1_unit_kompetensi: payload.target[0].unitKompetensi,
    c2_unit_kompetensi: payload.target[1].unitKompetensi,
    c3_unit_kompetensi: payload.target[2].unitKompetensi,

    tanggal_diskusi: payload.tanggalDiskusi,
    tanda_tangan_pegawai: payload.pegawai.nama,
    tanda_tangan_atasan: payload.atasan.nama,
  });

  const buffer = doc.getZip().generate({ type: 'nodebuffer' });

  const fileName = `IDP_${safeFilename(payload.pegawai.nama)}.docx`;
  const outputPath = path.join(outputDir, fileName);

  fs.writeFileSync(outputPath, buffer);

  return {
    outputPath,
    fileName,
  };
}

module.exports = {
  generateIdpDocx,
};