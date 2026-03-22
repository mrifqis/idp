const sessions = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      jabatan: null,
      level: null,
      nomenklatur: null,
      competencyType: null,
      currentOptions: [],
      currentOptionMap: {},
    });
  }
  return sessions.get(userId);
}

function resetSession(userId) {
  sessions.set(userId, {
    jabatan: null,
    level: null,
    nomenklatur: null,
    competencyType: null,
    currentOptions: [],
    currentOptionMap: {},
  });
}

module.exports = {
  getSession,
  resetSession,
};