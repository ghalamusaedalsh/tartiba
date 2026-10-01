/* Themes: pastel and dark. Colors come from the palettes Ghala chose. */
(function () {
  const T = (window.T = window.T || {});

  T.THEMES = [
    // ---- pastels ----
    { id: 'fresh', group: 'pastel', name: { en: 'Fresh', ar: 'منعش' }, swatch: ['#E8F5E9', '#A8D5A0', '#5A9A5A', '#2A4A2A'],
      c: { base: '#cedfbe', stripe: 'rgba(146,188,109,.52)', card: '#f1f9ec', tag: '#4b6334', tagText: '#ffffff', tagDash: '#6ad3e8',
        text: '#1f2a17', muted: '#6b7d5c', accent: '#4b6334', accentText: '#ffffff', soft: '#e1eed5', line: '#cfe1c0', danger: '#d23b4b' } },
    { id: 'pastel', group: 'pastel', name: { en: 'Soft Pastel', ar: 'باستيل' }, swatch: ['#F0E6F5', '#D4E8E0', '#F5D6D6', '#E8E0C8'],
      c: { base: '#f0e6f5', stripe: 'rgba(212,232,224,.62)', card: '#fbf7fc', tag: '#8e7aa3', tagText: '#ffffff', tagDash: '#f5d6d6',
        text: '#3a3042', muted: '#8a7f92', accent: '#8e7aa3', accentText: '#ffffff', soft: '#efe6f2', line: '#e6dcea', danger: '#c84a5f' } },
    { id: 'berry', group: 'pastel', name: { en: 'Berry Pink', ar: 'توت وردي' }, swatch: ['#ED638D', '#FFB3C9', '#FFE5F4', '#F0BDC6'],
      c: { base: '#ffe5f4', stripe: 'rgba(255,179,201,.5)', card: '#fff6fb', tag: '#ed638d', tagText: '#ffffff', tagDash: '#ffe5f4',
        text: '#4a2433', muted: '#a0687d', accent: '#e0507c', accentText: '#ffffff', soft: '#ffe3ee', line: '#f7d3e1', danger: '#c8304f' } },
    { id: 'blueberry', group: 'pastel', name: { en: 'Blueberry Puff', ar: 'توت أزرق' }, swatch: ['#8B98E3', '#C9C9EA', '#F9E2EB', '#F5C8E7'],
      c: { base: '#f9e2eb', stripe: 'rgba(201,201,234,.62)', card: '#fdf7fa', tag: '#8b98e3', tagText: '#ffffff', tagDash: '#f5c8e7',
        text: '#2f3157', muted: '#7d7fa8', accent: '#7381d6', accentText: '#ffffff', soft: '#efe7f3', line: '#e6dff0', danger: '#c8455f' } },
    { id: 'mint', group: 'pastel', name: { en: 'Mint Cream', ar: 'نعناع وكريمة' }, swatch: ['#8BCED8', '#FEC2DC', '#F7E4EE', '#FEA0BF'],
      c: { base: '#f7e4ee', stripe: 'rgba(139,206,216,.42)', card: '#fffafc', tag: '#5fb0bd', tagText: '#ffffff', tagDash: '#fec2dc',
        text: '#2c3e42', muted: '#7f9da2', accent: '#4fa3b0', accentText: '#ffffff', soft: '#e9f4f5', line: '#f0dde7', danger: '#cf4a6e' } },
    { id: 'melon', group: 'pastel', name: { en: 'Melon', ar: 'شمّام' }, swatch: ['#B9C97B', '#E7E4AF', '#E9F2E9', '#D4E1CC'],
      c: { base: '#e9f2e9', stripe: 'rgba(212,205,140,.5)', card: '#fbfdf8', tag: '#8fa04f', tagText: '#ffffff', tagDash: '#e7e4af',
        text: '#33401c', muted: '#7f8a63', accent: '#7f9142', accentText: '#ffffff', soft: '#eef3df', line: '#e1e9d3', danger: '#c4473e' } },
    // ---- dark ----
    { id: 'forest', group: 'dark', name: { en: 'Forest', ar: 'غابة' }, swatch: ['#E8F5E9', '#A8D5A0', '#5A9A5A', '#2A4A2A'],
      c: { base: '#1b2c1b', stripe: 'rgba(90,154,90,.15)', card: '#233a23', tag: '#a8d5a0', tagText: '#1b2e1b', tagDash: '#4f7f4f',
        text: '#e8f5e9', muted: '#9fbf9a', accent: '#a8d5a0', accentText: '#1b2e1b', soft: '#2c472c', line: '#2f4b2f', danger: '#ff8a8a' } },
    { id: 'navy', group: 'dark', name: { en: 'Navy', ar: 'كحلي' }, swatch: ['#E8EEF2', '#A8B8C8', '#5A7A8A', '#1E2A32'],
      c: { base: '#141c23', stripe: 'rgba(90,122,138,.14)', card: '#1e2a33', tag: '#a8b8c8', tagText: '#1e2a32', tagDash: '#5a7a8a',
        text: '#e8eef2', muted: '#8fa3b3', accent: '#a8b8c8', accentText: '#1e2a32', soft: '#283845', line: '#2b3a46', danger: '#ff8f8f' } },
    { id: 'plum', group: 'dark', name: { en: 'Plum', ar: 'برقوقي' }, swatch: ['#F5E8F0', '#D4ABC8', '#8B5A7A', '#3A2A3A'],
      c: { base: '#241a24', stripe: 'rgba(139,90,122,.16)', card: '#332533', tag: '#d4abc8', tagText: '#3a2a3a', tagDash: '#8b5a7a',
        text: '#f5e8f0', muted: '#b897ad', accent: '#d4abc8', accentText: '#3a2a3a', soft: '#422f42', line: '#433043', danger: '#ff8fa6' } },
    { id: 'teal', group: 'dark', name: { en: 'Deep Teal', ar: 'فيروزي داكن' }, swatch: ['#E8F4F2', '#A8D5D0', '#5B9A94', '#2A4A47'],
      c: { base: '#172b29', stripe: 'rgba(91,154,148,.14)', card: '#203b38', tag: '#a8d5d0', tagText: '#1a302e', tagDash: '#5b9a94',
        text: '#e8f4f2', muted: '#93bdb8', accent: '#a8d5d0', accentText: '#1a302e', soft: '#2a4a47', line: '#2b4a47', danger: '#ff8f8f' } },
    { id: 'mocha', group: 'dark', name: { en: 'Mocha', ar: 'موكا' }, swatch: ['#E8E0D8', '#A89888', '#5C4A3A', '#1A1410'],
      c: { base: '#1a1410', stripe: 'rgba(92,74,58,.3)', card: '#2a211b', tag: '#c8b8a6', tagText: '#1a1410', tagDash: '#5c4a3a',
        text: '#e8e0d8', muted: '#a89888', accent: '#c8b8a6', accentText: '#1a1410', soft: '#3a2e25', line: '#3a2f27', danger: '#ff9a8a' } },
  ];

  T.themeById = (id) => T.THEMES.find((t) => t.id === id) || T.THEMES[0];

  T.applyTheme = (id) => {
    const th = T.themeById(id);
    const root = document.documentElement;
    for (const [k, v] of Object.entries(th.c)) root.style.setProperty('--' + k, v);
    root.dataset.theme = th.id;
    root.dataset.mode = th.group === 'dark' ? 'dark' : 'light';
  };
})();
