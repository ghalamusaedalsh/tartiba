import { useEffect, useMemo, useState } from "react";
import { dirFor, t, type Lang } from "./i18n";
import { loadLang, loadNotes, newNote, saveLang, saveNotes, type Note } from "./notes";

function formatTime(ts: number, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(ts);
}

function preview(note: Note): string {
  return note.body.replace(/\s+/g, " ").trim().slice(0, 80);
}

export default function App() {
  const [lang, setLang] = useState<Lang>(loadLang);
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [selectedId, setSelectedId] = useState<string | null>(() => loadNotes()[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const s = t(lang);

  // Keep the whole window's direction in sync with the language.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
    document.title = lang === "ar" ? "ترتيبة" : "Tartiba";
    saveLang(lang);
  }, [lang]);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const sorted = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt),
    [notes],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
    );
  }, [sorted, query]);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  function addNote() {
    const note = newNote();
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
    setQuery("");
  }

  function updateSelected(patch: Partial<Pick<Note, "title" | "body">>) {
    if (!selectedId) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedId ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    );
  }

  function deleteSelected() {
    if (!selected || !window.confirm(s.confirmDelete)) return;
    const remaining = sorted.filter((n) => n.id !== selected.id);
    setNotes(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="sidebar__header">
          <h1 className="brand">{s.appName}</h1>
          <button
            className="btn btn--ghost"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            lang={lang === "ar" ? "en" : "ar"}
          >
            {s.switchLang}
          </button>
        </header>

        <button className="btn btn--primary" onClick={addNote}>
          + {s.newNote}
        </button>

        <input
          className="search"
          type="search"
          value={query}
          placeholder={s.search}
          onChange={(e) => setQuery(e.target.value)}
        />

        <ul className="note-list">
          {visible.map((n) => (
            <li key={n.id}>
              <button
                className={"note-item" + (n.id === selectedId ? " is-active" : "")}
                onClick={() => setSelectedId(n.id)}
              >
                <span className="note-item__title" dir="auto">
                  {n.title.trim() || s.untitled}
                </span>
                <span className="note-item__preview" dir="auto">
                  {preview(n)}
                </span>
              </button>
            </li>
          ))}
          {notes.length > 0 && visible.length === 0 && (
            <li className="note-list__empty">{s.noResults}</li>
          )}
        </ul>
      </aside>

      <main className="editor">
        {selected ? (
          <>
            <div className="editor__bar">
              <span className="muted">
                {s.edited}: {formatTime(selected.updatedAt, lang)}
              </span>
              <button className="btn btn--danger" onClick={deleteSelected}>
                {s.delete}
              </button>
            </div>
            <input
              className="editor__title"
              dir="auto"
              value={selected.title}
              placeholder={s.titlePlaceholder}
              onChange={(e) => updateSelected({ title: e.target.value })}
            />
            <textarea
              className="editor__body"
              dir="auto"
              value={selected.body}
              placeholder={s.bodyPlaceholder}
              onChange={(e) => updateSelected({ body: e.target.value })}
            />
          </>
        ) : (
          <div className="empty">
            <p className="empty__title">{s.empty}</p>
            <button className="btn btn--primary" onClick={addNote}>
              + {s.emptyHint}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
