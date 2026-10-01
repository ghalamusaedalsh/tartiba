/* Dates: Gregorian + Hijri (Umm al-Qura, the official Saudi calendar). */
(function () {
  const T = (window.T = window.T || {});

  const GREG = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  };
  const HIJRI = {
    en: ['Muharram', 'Safar', 'Rabiʻ I', 'Rabiʻ II', 'Jumada I', 'Jumada II', 'Rajab', 'Shaʻban', 'Ramadan', 'Shawwal', 'Dhu al-Qiʻdah', 'Dhu al-Hijjah'],
    ar: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'],
  };
  const WEEKDAYS = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  };

  const pad = (n) => String(n).padStart(2, '0');
  const key = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };

  let hijriFmt = null;
  function hijri(d) {
    if (!hijriFmt) hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const parts = hijriFmt.formatToParts(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12));
    const get = (t) => Number((parts.find((p) => p.type === t) || {}).value);
    return { day: get('day'), month: get('month'), year: parseInt((parts.find((p) => p.type === 'year') || {}).value, 10) };
  }

  T.dates = {
    GREG, HIJRI, WEEKDAYS, pad, key, parse, hijri,
    todayKey: () => key(new Date()),
    hijriMonthName: (m, lang) => HIJRI[lang][m - 1] || '',
    hijriSuffix: (lang) => (lang === 'ar' ? 'هـ' : 'AH'),
    // "Thursday, 1 October 2026"
    longGregorian(k, lang) {
      const d = parse(k);
      return WEEKDAYS[lang][d.getDay()] + (lang === 'ar' ? '، ' : ', ') + d.getDate() + ' ' + GREG[lang][d.getMonth()] + ' ' + d.getFullYear();
    },
    // "19 Rabiʻ II 1448 AH"
    longHijri(k, lang) {
      const h = hijri(parse(k));
      return h.day + ' ' + HIJRI[lang][h.month - 1] + ' ' + h.year + ' ' + T.dates.hijriSuffix(lang);
    },
    // Hijri months covered by a Gregorian month, e.g. "Rabiʻ II – Jumada I 1448 AH"
    hijriRange(year, month, lang) {
      const a = hijri(new Date(year, month, 1, 12));
      const b = hijri(new Date(year, month + 1, 0, 12));
      const sfx = T.dates.hijriSuffix(lang);
      const name = (h) => HIJRI[lang][h.month - 1];
      if (a.month === b.month && a.year === b.year) return name(a) + ' ' + a.year + ' ' + sfx;
      if (a.year === b.year) return name(a) + ' – ' + name(b) + ' ' + b.year + ' ' + sfx;
      return name(a) + ' ' + a.year + ' – ' + name(b) + ' ' + b.year + ' ' + sfx;
    },
    // Calendar cells for a month (Sunday-first), including faded days of the neighbouring months.
    monthCells(year, month) {
      const first = new Date(year, month, 1, 12);
      const offset = first.getDay();
      const days = new Date(year, month + 1, 0).getDate();
      const rows = Math.ceil((offset + days) / 7);
      const cells = [];
      for (let i = 0; i < rows * 7; i++) {
        const d = new Date(year, month, 1 - offset + i, 12);
        cells.push({ date: d, key: key(d), inMonth: d.getMonth() === month, weekday: d.getDay() });
      }
      return { cells, rows };
    },
  };
})();
