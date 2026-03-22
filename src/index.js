require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const {
  getTeknisKompetensiByNomenklatur,
  getTeknisDetail,
  getManajerialKompetensiList,
  getManajerialDetail,
  getSosialKompetensiList,
  getSosialDetail,
} = require('./excel');
const { getSession, resetSession } = require('./session');
const { clean, escapeMarkdown, splitLongText } = require('./utils');

const fs = require('fs');

const {
  createPrintSession,
  getPrintSession,
  clearPrintSession,
} = require('./printSession');

const { generateIdpDocx } = require('./generateDocx');

const bot = new Telegraf(process.env.BOT_TOKEN);

const PELAKSANA_NOMENKLATUR = [
  'Penelaah Teknis Kebijakan',
  'Pengolah Data dan Informasi',
  'Pengadministrasi Perkantoran',
  'Account Representative',
  'Juru Sita Keuangan Negara',
  'Penelaah Keberatan',
];

function menuJabatan() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Pelaksana/AR/PK/Juru Sita', 'JAB_PEL')],
    [Markup.button.callback('Kasi', 'JAB_KASI')],
  ]);
}

function buildIndexedMenu(items, prefix, backCallback) {
  const rows = items.map((item, index) => [
    Markup.button.callback(item, `${prefix}_${index}`),
  ]);

  if (backCallback) {
    rows.push([Markup.button.callback('Kembali', backCallback)]);
  }

  return Markup.inlineKeyboard(rows);
}

function menuNomenklaturPelaksana() {
  return buildIndexedMenu(PELAKSANA_NOMENKLATUR, 'NOM', 'BACK_JAB');
}

function menuJenisKompetensi(jabatan) {
  const rows = [];

  if (jabatan === 'Pelaksana') {
    rows.push([Markup.button.callback('Teknis', 'TYPE_TEKNIS')]);
  } else if (jabatan === 'Kasi') {
    rows.push([Markup.button.callback('Teknis', 'TYPE_TEKNIS_KASI')]);
  }

  rows.push([Markup.button.callback('Manajerial', 'TYPE_MANAJERIAL')]);
  rows.push([Markup.button.callback('Sosial Kultural', 'TYPE_SOSKUL')]);
  rows.push([Markup.button.callback('Kembali', 'BACK_TO_PREV')]);

  return Markup.inlineKeyboard(rows);
}

function menuCetakJabatan() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Pelaksana/AR/PK/Juru Sita', 'CETAK_JAB_PEL')],
    [Markup.button.callback('Kasi', 'CETAK_JAB_KASI')],
  ]);
}

function menuCetakNomenklatur() {
  return buildIndexedMenu(PELAKSANA_NOMENKLATUR, 'CETAK_NOM', 'CETAK_BATAL');
}

function menuCetakKompetensiTeknis(options) {
  return buildIndexedMenu(options, 'CETAK_TEKNIS', 'CETAK_BATAL');
}

function menuCetakKompetensiManajerial(options) {
  return buildIndexedMenu(options, 'CETAK_MANAJERIAL', 'CETAK_BATAL');
}

function menuCetakKompetensiSosial(options) {
  return buildIndexedMenu(options, 'CETAK_SOSIAL', 'CETAK_BATAL');
}

async function sendMainMenu(ctx) {
  await ctx.reply('Pilih Jabatan:', menuJabatan());
}

async function sendKompetensiResult(ctx, title, body) {
  const fullText = `*${escapeMarkdown(title)}*\n\n${escapeMarkdown(body)}`;
  const chunks = splitLongText(fullText);

  for (const chunk of chunks) {
    await ctx.reply(chunk, { parse_mode: 'MarkdownV2' });
  }
}

bot.start(async (ctx) => {
  resetSession(ctx.from.id);
  await sendMainMenu(ctx);
});

bot.command('menu', async (ctx) => {
  resetSession(ctx.from.id);
  await sendMainMenu(ctx);
});

bot.action('JAB_PEL', async (ctx) => {
  const session = getSession(ctx.from.id);
  session.jabatan = 'Pelaksana';
  session.level = 1;
  session.nomenklatur = null;
  session.competencyType = null;

  await ctx.answerCbQuery();
  await ctx.reply('Pilih Nomenklatur:', menuNomenklaturPelaksana());
});

bot.action('JAB_KASI', async (ctx) => {
  const session = getSession(ctx.from.id);
  session.jabatan = 'Kasi';
  session.level = 2;
  session.nomenklatur = 'Kasi';
  session.competencyType = null;

  await ctx.answerCbQuery();
  await ctx.reply('Pilih nama kompetensi:', menuJenisKompetensi('Kasi'));
});

bot.action('BACK_JAB', async (ctx) => {
  resetSession(ctx.from.id);
  await ctx.answerCbQuery();
  await sendMainMenu(ctx);
});

bot.action(/^NOM_(\d+)$/, async (ctx) => {
  const session = getSession(ctx.from.id);
  const index = Number(ctx.match[1]);
  const nomenklatur = PELAKSANA_NOMENKLATUR[index];

  await ctx.answerCbQuery();

  if (!nomenklatur) {
    return ctx.reply('Pilihan nomenklatur tidak valid. Silakan /start lagi.');
  }

  session.nomenklatur = nomenklatur;
  await ctx.reply(
    `Nomenklatur terpilih: ${nomenklatur}\n\nPilih nama kompetensi:`,
    menuJenisKompetensi('Pelaksana')
  );
});

bot.action('TYPE_TEKNIS', async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();

  if (!session.nomenklatur) {
    return ctx.reply('Silakan pilih nomenklatur terlebih dahulu.');
  }

  const list = getTeknisKompetensiByNomenklatur(session.nomenklatur);

  if (!list.length) {
    return ctx.reply('Kompetensi teknis tidak ditemukan untuk nomenklatur tersebut.');
  }

  session.competencyType = 'Teknis';
  session.currentOptions = list;
  session.currentOptionMap = {};

  list.forEach((item, idx) => {
    session.currentOptionMap[idx] = item;
  });

  await ctx.reply(
    `Pilih Kompetensi Teknis untuk ${session.nomenklatur}:`,
    buildIndexedMenu(list, 'OPT', 'BACK_TYPE')
  );
});

bot.action('TYPE_TEKNIS_KASI', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    'Data kompetensi teknis untuk jabatan Kasi belum tersedia pada sheet Teknis di file Excel saat ini.'
  );
});

bot.action('TYPE_MANAJERIAL', async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();

  const list = getManajerialKompetensiList();
  session.competencyType = 'Manajerial';
  session.currentOptions = list;
  session.currentOptionMap = {};

  list.forEach((item, idx) => {
    session.currentOptionMap[idx] = item;
  });

  await ctx.reply(
    'Pilih Kompetensi Manajerial:',
    buildIndexedMenu(list, 'OPT', 'BACK_TYPE')
  );
});

bot.action('TYPE_SOSKUL', async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();

  const list = getSosialKompetensiList();
  session.competencyType = 'Sosial Kultural';
  session.currentOptions = list;
  session.currentOptionMap = {};

  list.forEach((item, idx) => {
    session.currentOptionMap[idx] = item;
  });

  await ctx.reply(
    'Pilih Kompetensi Sosial Kultural:',
    buildIndexedMenu(list, 'OPT', 'BACK_TYPE')
  );
});

bot.action(/^OPT_(\d+)$/, async (ctx) => {
  const session = getSession(ctx.from.id);
  const index = Number(ctx.match[1]);
  const selected = session.currentOptionMap[index];

  await ctx.answerCbQuery();

  if (!selected) {
    return ctx.reply('Pilihan tidak valid. Silakan pilih kembali dari menu.');
  }

  if (session.competencyType === 'Teknis') {
    const detail = getTeknisDetail(session.nomenklatur, selected);

    if (!detail) {
      return ctx.reply('Detail kompetensi teknis tidak ditemukan.');
    }

    const body =
      `Nomenklatur: ${detail.nomenklatur}\n` +
      `Kompetensi Teknis: ${detail.kompetensi}\n` +
      `Level: ${detail.level}\n\n` +
      `Indikator Kompetensi Teknis:\n${detail.indikator}`;

    return sendKompetensiResult(ctx, 'Detail Kompetensi Teknis', body);
  }

  if (session.competencyType === 'Manajerial') {
    const detail = getManajerialDetail(selected, session.level);

    if (!detail) {
      return ctx.reply('Detail kompetensi manajerial tidak ditemukan.');
    }

    const body =
      `Kompetensi: ${detail.kompetensi}\n` +
      `Level: ${detail.level}\n\n` +
      `Indikator Perilaku:\n${detail.indikator}`;

    return sendKompetensiResult(ctx, 'Detail Kompetensi Manajerial', body);
  }

  if (session.competencyType === 'Sosial Kultural') {
    const detail = getSosialDetail(selected, session.level);

    if (!detail) {
      return ctx.reply('Detail kompetensi sosial kultural tidak ditemukan.');
    }

    const body =
      `Kompetensi: ${detail.kompetensi}\n` +
      `Level: ${detail.level}\n\n` +
      `Indikator Perilaku:\n${detail.indikator}`;

    return sendKompetensiResult(ctx, 'Detail Kompetensi Sosial Kultural', body);
  }

  return ctx.reply('Jenis kompetensi belum dipilih.');
});

bot.action('BACK_TYPE', async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();
  await ctx.reply('Pilih nama kompetensi:', menuJenisKompetensi(session.jabatan));
});

bot.action('BACK_TO_PREV', async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();

  if (session.jabatan === 'Pelaksana') {
    return ctx.reply('Pilih Nomenklatur:', menuNomenklaturPelaksana());
  }

  return sendMainMenu(ctx);
});

bot.command('cetak', async (ctx) => {
  createPrintSession(ctx.from.id);
  await ctx.reply('Masukkan Nama Pegawai:');
});

bot.action('CETAK_BATAL', async (ctx) => {
  clearPrintSession(ctx.from.id);
  await ctx.answerCbQuery();
  await ctx.reply('Proses /cetak dibatalkan.');
});

bot.action('CETAK_JAB_PEL', async (ctx) => {
  const session = getPrintSession(ctx.from.id);
  if (!session) return;

  session.data.jabatanAwal = 'Pelaksana';
  session.data.level = 1;
  session.step = 'cetak_pilih_nomenklatur';

  await ctx.answerCbQuery();
  await ctx.reply('Pilih Nomenklatur untuk Kompetensi Teknis:', menuCetakNomenklatur());
});

bot.action('CETAK_JAB_KASI', async (ctx) => {
  const session = getPrintSession(ctx.from.id);
  if (!session) return;

  session.data.jabatanAwal = 'Kasi';
  session.data.level = 2;
  session.data.nomenklatur = '';
  session.data.target[0].unitKompetensi = '-';
  session.data.target[0].level = '-';
  session.data.target[0].indikator = '-';

  const manajerialList = getManajerialKompetensiList();
  session.options.manajerial = manajerialList;
  session.step = 'cetak_pilih_manajerial';

  await ctx.answerCbQuery();
  await ctx.reply(
    'Data Kompetensi Teknis untuk Kasi belum tersedia, dilanjutkan ke Kompetensi Manajerial.\n\nPilih Unit Kompetensi Manajerial:',
    menuCetakKompetensiManajerial(manajerialList)
  );
});

bot.action(/^CETAK_NOM_(\d+)$/, async (ctx) => {
  const session = getPrintSession(ctx.from.id);
  if (!session) return;

  const index = Number(ctx.match[1]);
  const nomenklatur = PELAKSANA_NOMENKLATUR[index];
  if (!nomenklatur) return ctx.reply('Pilihan nomenklatur tidak valid.');

  session.data.nomenklatur = nomenklatur;

  const teknisList = getTeknisKompetensiByNomenklatur(nomenklatur);
  session.options.teknis = teknisList;
  session.step = 'cetak_pilih_teknis';

  await ctx.answerCbQuery();
  await ctx.reply(
    `Pilih Unit Kompetensi Teknis untuk ${nomenklatur}:`,
    menuCetakKompetensiTeknis(teknisList)
  );
});

bot.action(/^CETAK_TEKNIS_(\d+)$/, async (ctx) => {
  const session = getPrintSession(ctx.from.id);
  if (!session) return;

  const index = Number(ctx.match[1]);
  const selected = session.options.teknis[index];
  if (!selected) return ctx.reply('Pilihan kompetensi teknis tidak valid.');

  const detail = getTeknisDetail(session.data.nomenklatur, selected);
  if (!detail) return ctx.reply('Detail kompetensi teknis tidak ditemukan.');

  session.data.target[0].unitKompetensi = detail.kompetensi;
  session.data.target[0].level = detail.level;
  session.data.target[0].indikator = detail.indikator;

  const manajerialList = getManajerialKompetensiList();
  session.options.manajerial = manajerialList;
  session.step = 'cetak_pilih_manajerial';

  await ctx.answerCbQuery();
  await ctx.reply(
    'Pilih Unit Kompetensi Manajerial:',
    menuCetakKompetensiManajerial(manajerialList)
  );
});

bot.action(/^CETAK_MANAJERIAL_(\d+)$/, async (ctx) => {
  const session = getPrintSession(ctx.from.id);
  if (!session) return;

  const index = Number(ctx.match[1]);
  const selected = session.options.manajerial[index];
  if (!selected) return ctx.reply('Pilihan kompetensi manajerial tidak valid.');

  const detail = getManajerialDetail(selected, session.data.level);
  if (!detail) return ctx.reply('Detail kompetensi manajerial tidak ditemukan.');

  session.data.target[1].unitKompetensi = detail.kompetensi;
  session.data.target[1].level = detail.level;
  session.data.target[1].indikator = detail.indikator;

  const sosialList = getSosialKompetensiList();
  session.options.sosial = sosialList;
  session.step = 'cetak_pilih_sosial';

  await ctx.answerCbQuery();
  await ctx.reply(
    'Pilih Unit Kompetensi Sosial Kultural:',
    menuCetakKompetensiSosial(sosialList)
  );
});

bot.action(/^CETAK_SOSIAL_(\d+)$/, async (ctx) => {
  const session = getPrintSession(ctx.from.id);
  if (!session) return;

  const index = Number(ctx.match[1]);
  const selected = session.options.sosial[index];
  if (!selected) return ctx.reply('Pilihan kompetensi sosial kultural tidak valid.');

  const detail = getSosialDetail(selected, session.data.level);
  if (!detail) return ctx.reply('Detail kompetensi sosial kultural tidak ditemukan.');

  session.data.target[2].unitKompetensi = detail.kompetensi;
  session.data.target[2].level = detail.level;
  session.data.target[2].indikator = detail.indikator;

  try {
    const result = generateIdpDocx(session.data);

    await ctx.answerCbQuery();
    await ctx.reply('Dokumen berhasil dibuat. Berikut file-nya:');
    await ctx.replyWithDocument({
      source: result.outputPath,
      filename: result.fileName,
    });

    if (fs.existsSync(result.outputPath)) {
      fs.unlinkSync(result.outputPath);
    }

    clearPrintSession(ctx.from.id);
  } catch (error) {
    console.error(error);
    await ctx.answerCbQuery();
    await ctx.reply('Terjadi kesalahan saat membuat dokumen.');
  }
});

bot.on('text', async (ctx) => {
  const printSession = getPrintSession(ctx.from.id);

  if (printSession && printSession.mode === 'cetak') {
    const text = ctx.message.text.trim();

    switch (printSession.step) {
      case 'pegawai_nama':
        printSession.data.pegawai.nama = text;
        printSession.step = 'pegawai_nip';
        return ctx.reply('Masukkan NIP Pegawai:');

      case 'pegawai_nip':
        printSession.data.pegawai.nip = text;
        printSession.step = 'pegawai_jabatan';
        return ctx.reply('Masukkan Jabatan Pegawai:');

      case 'pegawai_jabatan':
        printSession.data.pegawai.jabatan = text;
        printSession.step = 'pegawai_unit_organisasi';
        return ctx.reply('Masukkan Unit Organisasi Pegawai:');

      case 'pegawai_unit_organisasi':
        printSession.data.pegawai.unitOrganisasi = text;
        printSession.step = 'pegawai_unit_kerja';
        return ctx.reply('Masukkan Unit Kerja Pegawai:');

      case 'pegawai_unit_kerja':
        printSession.data.pegawai.unitKerja = text;
        printSession.step = 'atasan_nama';
        return ctx.reply('Masukkan Nama Atasan:');

      case 'atasan_nama':
        printSession.data.atasan.nama = text;
        printSession.step = 'atasan_nip';
        return ctx.reply('Masukkan NIP Atasan:');

      case 'atasan_nip':
        printSession.data.atasan.nip = text;
        printSession.step = 'atasan_jabatan';
        return ctx.reply('Masukkan Jabatan Atasan:');

      case 'atasan_jabatan':
        printSession.data.atasan.jabatan = text;
        printSession.step = 'atasan_unit_organisasi';
        return ctx.reply('Masukkan Unit Organisasi Atasan:');

      case 'atasan_unit_organisasi':
        printSession.data.atasan.unitOrganisasi = text;
        printSession.step = 'atasan_unit_kerja';
        return ctx.reply('Masukkan Unit Kerja Atasan:');

      case 'atasan_unit_kerja':
        printSession.data.atasan.unitKerja = text;
        printSession.step = 'kekuatan';
        return ctx.reply('Masukkan Kekuatan:');

      case 'kekuatan':
        printSession.data.analisis.kekuatan = text;
        printSession.step = 'kelemahan';
        return ctx.reply('Masukkan Kelemahan:');

      case 'kelemahan':
        printSession.data.analisis.kelemahan = text;
        printSession.step = 'tanggal_diskusi';
        return ctx.reply('Masukkan Tanggal Diskusi Penyusunan IDP:');

      case 'tanggal_diskusi':
        printSession.data.tanggalDiskusi = text;
        printSession.step = 'pilih_jabatan_awal';
        return ctx.reply(
          'Pilih jabatan awal untuk penentuan level dan kompetensi:',
          menuCetakJabatan()
        );

      default:
        return ctx.reply('Lanjutkan proses /cetak atau gunakan /cetak untuk mulai ulang.');
    }
  }

  await ctx.reply('Silakan gunakan /start, /menu, atau /cetak.');
});

bot.launch();
console.log('Bot berjalan...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));