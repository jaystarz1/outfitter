// The palette matrix: deterministic colour theory for outfit building.
// (anchor item, anchor colour, occasion) -> palette swatches + per-category
// colour lists. This file IS the stylist's knowledge — no model involved.

export const COLOUR_HEX = {
  white: '#F5F4F0',
  cream: '#EDE6D6',
  'light blue': '#A8C4DD',
  blue: '#3B5C8F',
  navy: '#1F2A44',
  pink: '#E8B4BC',
  lavender: '#C4B7D7',
  grey: '#8A8D91',
  silver: '#C9CCD1',
  charcoal: '#3C3F43',
  black: '#17181A',
  tan: '#C8A97E',
  khaki: '#B8A888',
  brown: '#6B4A2F',
  olive: '#66663C',
  burgundy: '#6E2434',
  green: '#2F5D46',
  rust: '#A65E2E',
  mustard: '#C89B3C',
};

// Store colour tags are coarser than the matrix (Tip Top says "blue", never
// "navy"). Each matrix colour accepts these catalogue-tag fallbacks, in order.
export const COLOUR_FAMILY = {
  navy: ['blue'],
  'light blue': ['blue'],
  charcoal: ['grey', 'black'],
  burgundy: ['red', 'wine', 'maroon'],
  tan: ['beige', 'khaki', 'camel', 'sand', 'brown'],
  khaki: ['beige', 'tan', 'sand'],
  olive: ['green'],
  cream: ['white', 'beige', 'ivory'],
  silver: ['grey'],
  lavender: ['purple'],
  rust: ['orange', 'copper'],
  mustard: ['yellow', 'gold'],
};

// Anchor items the customer can build around, mapped to catalogue categories.
export const ANCHOR_ITEMS = [
  { key: 'pants', label: 'Trousers' },
  { key: 'shirt', label: 'Shirt' },
  { key: 'blazer', label: 'Jacket' },
  { key: 'suit', label: 'Suit' },
  { key: 'sweater', label: 'Sweater' },
];

export const ANCHOR_COLOURS = [
  'grey', 'charcoal', 'black', 'navy', 'blue', 'light blue',
  'white', 'pink', 'tan', 'brown', 'olive', 'burgundy', 'green',
];

export const OCCASIONS = [
  { key: 'office', label: 'Office' },
  { key: 'social', label: 'Social' },
  { key: 'formal', label: 'Formal' },
];

// Per anchor colour: ranked colour lists per role (conservative first).
// leather covers belt + shoes; accent covers tie + pocket square.
const HARMONY = {
  grey: {
    shirt: ['white', 'light blue', 'pink', 'lavender'],
    blazer: ['navy', 'charcoal', 'burgundy'],
    pants: ['charcoal', 'navy', 'black'],
    leather: ['black', 'burgundy'],
    accent: ['burgundy', 'navy', 'silver'],
    why: 'Grey takes almost any colour beside it — the shirt sets the tone, the jacket sets the formality.',
  },
  charcoal: {
    shirt: ['white', 'light blue', 'pink'],
    blazer: ['navy', 'grey', 'black'],
    pants: ['grey', 'black', 'navy'],
    leather: ['black'],
    accent: ['burgundy', 'silver', 'blue'],
    why: 'Charcoal is the sharpest neutral — keep the shirt light and let the accent carry the colour.',
  },
  black: {
    shirt: ['white', 'grey', 'black'],
    blazer: ['black', 'charcoal'],
    pants: ['black', 'charcoal', 'grey'],
    leather: ['black'],
    accent: ['silver', 'burgundy', 'black'],
    why: 'Black wants tonal company — white for contrast, charcoal and silver to keep it modern.',
  },
  navy: {
    shirt: ['white', 'light blue', 'pink'],
    blazer: ['grey', 'tan', 'navy'],
    pants: ['grey', 'tan', 'white'],
    leather: ['brown', 'black', 'burgundy'],
    accent: ['burgundy', 'rust', 'green'],
    why: 'Navy is the classic anchor — brown leather warms it, burgundy and rust give it depth.',
  },
  blue: {
    shirt: ['white', 'light blue'],
    blazer: ['navy', 'grey', 'tan'],
    pants: ['grey', 'navy', 'tan'],
    leather: ['brown', 'black'],
    accent: ['navy', 'burgundy', 'mustard'],
    why: 'Mid blue plays well with neutrals — grey and tan keep it easy, navy sharpens it up.',
  },
  'light blue': {
    shirt: ['white', 'light blue'],
    blazer: ['navy', 'grey', 'tan'],
    pants: ['navy', 'grey', 'tan'],
    leather: ['brown', 'black'],
    accent: ['navy', 'burgundy'],
    why: 'Light blue brightens everything around it — ground it with navy or grey below.',
  },
  white: {
    shirt: ['light blue', 'pink', 'white'],
    blazer: ['navy', 'tan', 'olive'],
    pants: ['navy', 'grey', 'tan', 'olive'],
    leather: ['brown', 'tan', 'black'],
    accent: ['navy', 'green', 'rust'],
    why: 'White is a blank canvas — nearly any jacket and trouser combination sits well against it.',
  },
  pink: {
    shirt: ['white', 'light blue'],
    blazer: ['navy', 'grey', 'charcoal'],
    pants: ['navy', 'grey', 'charcoal'],
    leather: ['brown', 'black'],
    accent: ['navy', 'burgundy'],
    why: 'Pink reads confident against cool neutrals — navy and grey keep it grounded.',
  },
  tan: {
    shirt: ['white', 'light blue', 'pink'],
    blazer: ['navy', 'brown', 'olive'],
    pants: ['navy', 'olive', 'brown', 'white'],
    leather: ['brown', 'tan'],
    accent: ['green', 'navy', 'rust'],
    why: 'Tan is warm and relaxed — navy gives it structure, olive and rust keep it earthy.',
  },
  brown: {
    shirt: ['white', 'light blue', 'cream'],
    blazer: ['tan', 'navy', 'olive'],
    pants: ['tan', 'khaki', 'cream'],
    leather: ['brown', 'tan'],
    accent: ['rust', 'green', 'mustard'],
    why: 'Brown works in warm layers — cream and tan tone in, rust and mustard light it up.',
  },
  olive: {
    shirt: ['white', 'cream', 'light blue'],
    blazer: ['navy', 'brown', 'tan'],
    pants: ['tan', 'khaki', 'navy'],
    leather: ['brown', 'tan'],
    accent: ['rust', 'mustard', 'navy'],
    why: 'Olive is a quiet statement — earth tones agree with it, navy dresses it up.',
  },
  burgundy: {
    shirt: ['white', 'light blue', 'pink'],
    blazer: ['navy', 'grey', 'charcoal'],
    pants: ['grey', 'navy', 'charcoal'],
    leather: ['black', 'brown'],
    accent: ['navy', 'silver'],
    why: 'Burgundy is rich — let it be the only loud thing and keep everything else neutral.',
  },
  green: {
    shirt: ['white', 'cream', 'light blue'],
    blazer: ['navy', 'tan', 'brown'],
    pants: ['tan', 'khaki', 'navy'],
    leather: ['brown', 'tan'],
    accent: ['rust', 'mustard', 'burgundy'],
    why: 'Deep green pairs with earth and navy — warm leather ties the whole look together.',
  },
};

const ROLE_DEFS = [
  { category: 'shirt', label: 'Shirts', from: 'shirt', count: 3 },
  { category: 'pants', label: 'Trousers', from: 'pants', count: 3 },
  { category: 'blazer', label: 'Sport Coats', from: 'blazer', count: 2 },
  { category: 'belt', label: 'Belts', from: 'leather', count: 2 },
  { category: 'shoes', label: 'Shoes', from: 'leather', count: 2 },
  { category: 'tie', label: 'Ties', from: 'accent', count: 2 },
  { category: 'pocket-square', label: 'Pocket Squares', from: 'accent', count: 2 },
];

const OCCASION_ROLES = {
  office: ['shirt', 'pants', 'blazer', 'belt', 'shoes', 'tie'],
  social: ['shirt', 'pants', 'blazer', 'belt', 'shoes', 'pocket-square'],
  formal: ['shirt', 'pants', 'blazer', 'belt', 'shoes', 'tie', 'pocket-square'],
};

// Anchor item excludes its own category (a suit covers jacket + trousers).
const ANCHOR_EXCLUDES = {
  pants: ['pants'],
  shirt: ['shirt'],
  blazer: ['blazer'],
  suit: ['pants', 'blazer'],
  sweater: ['blazer', 'tie', 'pocket-square'],
};

const cap = (s) => s.replace(/\b\w/g, (ch) => ch.toUpperCase());

// (item, colour, occasion) -> { swatches, roles, why } or null if unknown.
export function buildPlan(item, colour, occasion) {
  const h = HARMONY[colour === 'khaki' ? 'tan' : colour];
  if (!h || !OCCASION_ROLES[occasion] || !ANCHOR_EXCLUDES[item]) return null;

  const excluded = new Set(ANCHOR_EXCLUDES[item]);
  const wanted = new Set(OCCASION_ROLES[occasion]);
  const roles = [];
  for (const def of ROLE_DEFS) {
    if (!wanted.has(def.category) || excluded.has(def.category)) continue;
    let colours = h[def.from];
    if (occasion === 'formal') {
      if (def.category === 'shirt') colours = colours.filter((c) => ['white', 'light blue', 'cream'].includes(c));
      if (def.category === 'blazer') {
        const dark = colours.filter((c) => ['navy', 'charcoal', 'black'].includes(c));
        if (dark.length) colours = dark;
      }
      if (!colours.length) colours = ['white'];
    }
    roles.push({ category: def.category, label: def.label, colours, count: def.count });
  }

  const swatches = [{ name: cap(colour), hex: COLOUR_HEX[colour] || '#999', use: 'your ' +
    (ANCHOR_ITEMS.find((a) => a.key === item)?.label.toLowerCase() || item) }];
  const seen = new Set([colour]);
  for (const role of roles) {
    // Shirts show up to three options; other roles show their first colour
    // not already on the strip (fall through so tonal looks still fill out).
    let quota = role.category === 'shirt' ? 3 : 1;
    for (const c of role.colours) {
      if (!quota) break;
      if (seen.has(c)) continue;
      seen.add(c);
      quota--;
      swatches.push({ name: cap(c), hex: COLOUR_HEX[c] || '#999', use: role.label.toLowerCase() });
    }
  }

  return { swatches, roles, why: h.why };
}
