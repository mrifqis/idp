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

bot.on('text', async (ctx) => {
  await ctx.reply('Silakan gunakan /start atau /menu untuk memulai.');
});

bot.launch();
console.log('Bot berjalan...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));