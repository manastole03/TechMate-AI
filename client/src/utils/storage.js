const CHATS_KEY = 'llama_chats_v1';
const SETTINGS_KEY = 'llama_settings_v1';

export function generateId(prefix = 'id') {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${rand}`;
}

export function loadChats() {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveChats(data) {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(data));
  } catch {}
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSettings(data) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  } catch {}
}