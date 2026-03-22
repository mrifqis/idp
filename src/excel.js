const XLSX = require('xlsx');
const path = require('path');
const { clean } = require('./utils');

const workbook = XLSX.readFile(path.join(__dirname, '..', 'data', 'IDP.xlsx'));

const teknisSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Teknis']);
const manajerialSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Manajerial']);
const sosialSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Sosial Kultural']);

function normalizeTeknisRow(row) {
  return {
    nomenklatur: clean(row['Nomenklatur']),
    kompetensi: clean(row['KOMPETENSI TEKNIS']),
    level: clean(row['Level']),
    indikator: clean(row['INDIKATOR KOMPETENSI TEKNIS']),
  };
}

function normalizeManajerialRow(row) {
  return {
    kompetensi: clean(row['Kompetensi']),
    level: Number(clean(row['Level'])),
    indikator: clean(row['Indikator Perilaku']),
  };
}

function normalizeSosialRow(row) {
  return {
    kompetensi: clean(row['Kompetensi']),
    level: Number(clean(row['Level'])),
    indikator: clean(row['Indikator Perilaku']),
  };
}

const teknisData = teknisSheet.map(normalizeTeknisRow);
const manajerialData = manajerialSheet.map(normalizeManajerialRow);
const sosialData = sosialSheet.map(normalizeSosialRow);

function getTeknisNomenklaturList() {
  return [...new Set(teknisData.map(row => row.nomenklatur).filter(Boolean))];
}

function getTeknisKompetensiByNomenklatur(nomenklatur) {
  const target = clean(nomenklatur);
  return [
    ...new Set(
      teknisData
        .filter(row => row.nomenklatur === target)
        .map(row => row.kompetensi)
        .filter(Boolean)
    ),
  ];
}

function getTeknisDetail(nomenklatur, kompetensi) {
  const targetNomenklatur = clean(nomenklatur);
  const targetKompetensi = clean(kompetensi);

  return teknisData.find(
    row =>
      row.nomenklatur === targetNomenklatur &&
      row.kompetensi === targetKompetensi
  );
}

function getManajerialKompetensiList() {
  return [...new Set(manajerialData.map(row => row.kompetensi).filter(Boolean))];
}

function getManajerialDetail(kompetensi, level) {
  const targetKompetensi = clean(kompetensi);
  const targetLevel = Number(level);

  return manajerialData.find(
    row => row.kompetensi === targetKompetensi && row.level === targetLevel
  );
}

function getSosialKompetensiList() {
  return [...new Set(sosialData.map(row => row.kompetensi).filter(Boolean))];
}

function getSosialDetail(kompetensi, level) {
  const targetKompetensi = clean(kompetensi);
  const targetLevel = Number(level);

  return sosialData.find(
    row => row.kompetensi === targetKompetensi && row.level === targetLevel
  );
}

module.exports = {
  getTeknisNomenklaturList,
  getTeknisKompetensiByNomenklatur,
  getTeknisDetail,
  getManajerialKompetensiList,
  getManajerialDetail,
  getSosialKompetensiList,
  getSosialDetail,
};