// Notes storage. For now notes live in the app's local storage, which Tauri keeps
// between launches. Later this module can switch to saving files on disk without
// the rest of the app changing.

export interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

const NOTES_KEY = "tartiba.notes.v1";
const LANG_KEY = "tartiba.lang";

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Note[]) : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    // Storage unavailable; notes stay in memory for this session.
  }
}

export function loadLang(): "ar" | "en" {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

export function saveLang(lang: "ar" | "en"): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

export function newNote(): Note {
  return {
    id: crypto.randomUUID(),
    title: "",
    body: "",
    updatedAt: Date.now(),
  };
}
