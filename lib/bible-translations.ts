export const BIBLE_TRANSLATIONS = [
  { id: 'de4e12af7f28f599-02', name: 'King James Version (KJV)' },
  { id: '06125adad2d5898a-01', name: 'American Standard Version (ASV)' },
  { id: '9879dbb7cfe39e4d-04', name: 'World English Bible (WEB)' },
  { id: 'bba9f40183526463-01', name: 'Berean Standard Bible (BSB)' },
  { id: '555fef9a6cb31151-01', name: 'Contemporary English Version (CEV)' },
  { id: '01b29f4b342acc35-01', name: 'Literal Standard Version (LSV)' },
] as const;

export type BibleTranslationId = typeof BIBLE_TRANSLATIONS[number]['id'];

