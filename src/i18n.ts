export type Lang = "ar" | "en";

const strings = {
  ar: {
    appName: "ترتيبة",
    newNote: "ملاحظة جديدة",
    search: "ابحث في ملاحظاتك…",
    untitled: "بدون عنوان",
    titlePlaceholder: "العنوان",
    bodyPlaceholder: "اكتب هنا…",
    delete: "حذف",
    confirmDelete: "حذف هذه الملاحظة؟",
    empty: "لا توجد ملاحظات بعد",
    emptyHint: "أضف ملاحظتك الأولى",
    noResults: "لا نتائج",
    switchLang: "English",
    saved: "محفوظ",
    edited: "آخر تعديل",
  },
  en: {
    appName: "Tartiba",
    newNote: "New note",
    search: "Search your notes…",
    untitled: "Untitled",
    titlePlaceholder: "Title",
    bodyPlaceholder: "Start writing…",
    delete: "Delete",
    confirmDelete: "Delete this note?",
    empty: "No notes yet",
    emptyHint: "Start with a new note",
    noResults: "No results",
    switchLang: "عربي",
    saved: "Saved",
    edited: "Last edited",
  },
} as const;

export type Strings = (typeof strings)[Lang];

export function t(lang: Lang): Strings {
  return strings[lang];
}

export function dirFor(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
