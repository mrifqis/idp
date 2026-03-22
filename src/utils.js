function clean(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function escapeMarkdown(text) {
  return clean(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function splitLongText(text, maxLength = 3500) {
  const value = clean(text);
  if (value.length <= maxLength) return [value];

  const chunks = [];
  let current = '';

  for (const part of value.split('\n')) {
    if ((current + '\n' + part).length > maxLength) {
      if (current) chunks.push(current);
      current = part;
    } else {
      current = current ? current + '\n' + part : part;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

module.exports = {
  clean,
  escapeMarkdown,
  splitLongText,
};