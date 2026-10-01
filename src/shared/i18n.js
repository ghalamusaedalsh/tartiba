/* All words shown in the app, in English and Arabic. */
(function () {
  const T = (window.T = window.T || {});

  const S = {
    appName: { en: 'Tartiba', ar: 'ترتيبة' },
    tasks: { en: 'Tasks', ar: 'المهام' },
    todayTasks: { en: "Today's tasks", ar: 'مهام اليوم' },
    calendar: { en: 'Calendar', ar: 'التقويم' },
    today: { en: 'Today', ar: 'اليوم' },
    widget: { en: 'Widget', ar: 'الودجت' },
    settings: { en: 'Settings', ar: 'الإعدادات' },
    otherLang: { en: 'عربي', ar: 'English' },
    month: { en: 'Month', ar: 'الشهر' },
    year: { en: 'Year', ar: 'السنة' },
    photoNotice: { en: "Don't add personal photos", ar: 'لا تضع صورًا شخصية' },
    addPhoto: { en: 'Add photo', ar: 'أضف صورة' },
    changePhoto: { en: 'Change', ar: 'تغيير' },
    removePhoto: { en: 'Remove', ar: 'إزالة' },
    pickQuote: { en: "Write today's quote", ar: 'اختر حكمة اليوم' },
    addTaskPlaceholder: { en: 'Write a new task…', ar: 'اكتب مهمة جديدة…' },
    add: { en: 'Add', ar: 'إضافة' },
    addTimer: { en: 'Timer', ar: 'مؤقت' },
    noTimer: { en: 'No timer', ar: 'بدون مؤقت' },
    hours: { en: 'h', ar: 'س' },
    minutes: { en: 'm', ar: 'د' },
    seconds: { en: 's', ar: 'ث' },
    start: { en: 'Start', ar: 'تشغيل' },
    pause: { en: 'Pause', ar: 'إيقاف مؤقت' },
    reset: { en: 'Reset', ar: 'إعادة' },
    edit: { en: 'Edit', ar: 'تعديل' },
    delete: { en: 'Delete', ar: 'حذف' },
    setTimer: { en: 'Set timer', ar: 'ضبط المؤقت' },
    removeTimer: { en: 'Remove timer', ar: 'إزالة المؤقت' },
    save: { en: 'Save', ar: 'حفظ' },
    cancel: { en: 'Cancel', ar: 'إلغاء' },
    close: { en: 'Close', ar: 'إغلاق' },
    confirmDelete: { en: 'Delete this task?', ar: 'حذف هذه المهمة؟' },
    yesDelete: { en: 'Yes, delete', ar: 'نعم، احذف' },
    noTasks: { en: 'No tasks yet — add your first one below ✨', ar: 'لا توجد مهام بعد — أضف أول مهمة بالأسفل ✨' },
    noTasksToday: { en: 'No tasks for today 🌿', ar: 'لا توجد مهام اليوم 🌿' },
    addFromApp: { en: 'Add tasks from the app', ar: 'أضف المهام من التطبيق' },
    timesUp: { en: "Time's up!", ar: 'انتهى الوقت!' },
    stop: { en: 'Stop', ar: 'إيقاف' },
    language: { en: 'Language', ar: 'اللغة' },
    theme: { en: 'Theme', ar: 'المظهر' },
    pastels: { en: 'Pastels', ar: 'ألوان باستيل' },
    darks: { en: 'Dark', ar: 'ألوان داكنة' },
    quotes: { en: 'Daily quotes', ar: 'حكمة كل يوم' },
    quotesHint: { en: 'One quote for each day of the week. It changes by itself every day.', ar: 'حكمة لكل يوم من أيام الأسبوع، تتغير تلقائيًا كل يوم.' },
    quotePlaceholder: { en: 'Write a quote…', ar: 'اكتب حكمة…' },
    timerSound: { en: 'Timer sound', ar: 'صوت المؤقت' },
    defaultSound: { en: 'Classic alarm clock', ar: 'منبه كلاسيكي' },
    changeSound: { en: 'Change sound…', ar: 'تغيير الصوت…' },
    useDefault: { en: 'Use default', ar: 'الصوت الافتراضي' },
    test: { en: 'Test', ar: 'تجربة' },
    soundHint: { en: 'Pick any song or sound file from your computer (MP3, WAV, M4A…).', ar: 'اختر أي أغنية أو ملف صوتي من جهازك (MP3، WAV، M4A…).' },
    widgetSection: { en: 'Desktop widget', ar: 'ودجت سطح المكتب' },
    openAtLogin: { en: 'Open the widget when Windows starts', ar: 'افتح الودجت عند تشغيل ويندوز' },
    showWidget: { en: 'Show widget now', ar: 'أظهر الودجت الآن' },
    hideWidget: { en: 'Hide widget', ar: 'إخفاء الودجت' },
    pinOn: { en: 'Floating on top — click to put behind windows', ar: 'فوق النوافذ — اضغط لوضعه خلفها' },
    pinOff: { en: 'Behind windows — click to keep on top', ar: 'خلف النوافذ — اضغط لإبقائه فوقها' },
    openApp: { en: 'Open Tartiba', ar: 'فتح ترتيبة' },
    back: { en: 'Back to calendar', ar: 'العودة للتقويم' },
    doubleClickEdit: { en: 'Double-click to edit', ar: 'انقر مرتين للتعديل' },
  };

  T.lang = 'en';
  T.t = (k) => (S[k] ? S[k][T.lang] : k);
  T.setLang = (lang) => {
    T.lang = lang === 'ar' ? 'ar' : 'en';
    document.documentElement.lang = T.lang;
    document.documentElement.dir = T.lang === 'ar' ? 'rtl' : 'ltr';
  };
})();
