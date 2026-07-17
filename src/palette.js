// The palette matrix: deterministic colour theory for outfit building.
// (anchor item, shade, occasion, picked colours) -> pickable palette options,
// per-category colour targets, and swatch strip. This file IS the stylist's
// knowledge — no model involved.

export const COLOUR_HEX = {
  white: '#F5F4F0',
  cream: '#EDE6D6',
  'light blue': '#A8C4DD',
  blue: '#3B5C8F',
  'mid blue': '#3B5C8F',
  navy: '#1F2A44',
  pink: '#E8B4BC',
  lavender: '#C4B7D7',
  'light grey': '#C2C4C6',
  grey: '#8A8D91',
  'mid grey': '#8A8D91',
  silver: '#C9CCD1',
  charcoal: '#3C3F43',
  black: '#17181A',
  tan: '#C8A97E',
  khaki: '#B8A888',
  brown: '#6B4A2F',
  'mid brown': '#6B4A2F',
  chocolate: '#43301F',
  olive: '#66663C',
  sage: '#9AA88C',
  forest: '#24402F',
  green: '#2F5D46',
  burgundy: '#6E2434',
  rust: '#A65E2E',
  mustard: '#C89B3C',
};

// Step 2: broad colour family. Step 3: the actual shade of the piece.
export const FAMILIES = [
  { key: 'grey', label: 'Grey', shades: ['light grey', 'mid grey', 'charcoal'] },
  { key: 'blue', label: 'Blue', shades: ['light blue', 'mid blue', 'navy'] },
  { key: 'brown', label: 'Brown', shades: ['tan', 'mid brown', 'chocolate'] },
  { key: 'green', label: 'Green', shades: ['sage', 'olive', 'forest'] },
  { key: 'black', label: 'Black', shades: ['black'] },
  { key: 'white', label: 'White', shades: ['white', 'cream'] },
  { key: 'pink', label: 'Pink', shades: ['pink'] },
  { key: 'burgundy', label: 'Burgundy', shades: ['burgundy'] },
];

export const ALL_SHADES = FAMILIES.flatMap((f) => f.shades);

// Store colour tags are coarser than the matrix (Tip Top says "blue", never
// "navy"). Each matrix colour accepts these catalogue-tag fallbacks, in order.
export const COLOUR_FAMILY = {
  navy: ['blue'],
  'light blue': ['blue'],
  'mid blue': ['blue'],
  'light grey': ['grey'],
  'mid grey': ['grey'],
  charcoal: ['grey', 'black'],
  burgundy: ['red', 'wine', 'maroon'],
  tan: ['beige', 'khaki', 'camel', 'sand', 'brown'],
  khaki: ['beige', 'tan', 'sand'],
  'mid brown': ['brown'],
  chocolate: ['brown'],
  olive: ['green'],
  sage: ['green'],
  forest: ['green'],
  cream: ['white', 'beige', 'ivory'],
  silver: ['grey'],
  lavender: ['purple'],
  rust: ['orange', 'copper'],
  mustard: ['yellow', 'gold'],
};

// Anchor items the customer can build around, mapped to catalogue categories.
export const ANCHOR_ITEMS = [
  { key: 'pants', label: 'Trousers', plural: true },
  { key: 'shirt', label: 'Shirt' },
  { key: 'blazer', label: 'Jacket' },
  { key: 'suit', label: 'Suit' },
  { key: 'sweater', label: 'Sweater' },
];

export const OCCASIONS = [
  { key: 'office', label: 'Office' },
  { key: 'social', label: 'Social' },
  { key: 'formal', label: 'Formal' },
];

// Per shade: ranked colour lists per role (conservative first). Role lists use
// catalogue-tag-friendly names. leather covers belt + shoes; accent covers
// tie + pocket square + socks.
const HARMONY = {
  'light grey': {
    shirt: ['white', 'light blue', 'pink', 'lavender'],
    blazer: ['navy', 'blue', 'charcoal'],
    pants: ['navy', 'charcoal', 'grey'],
    leather: ['black', 'brown'],
    accent: ['navy', 'burgundy', 'silver'],
    why: 'Light grey is bright and easy — cool pastels sit naturally on it, navy anchors it.',
  },
  'mid grey': {
    shirt: ['white', 'light blue', 'pink', 'lavender'],
    blazer: ['navy', 'charcoal', 'burgundy'],
    pants: ['charcoal', 'navy', 'black'],
    leather: ['black', 'burgundy'],
    accent: ['burgundy', 'navy', 'silver'],
    why: 'Mid grey takes almost any colour beside it — the shirt sets the tone, the jacket sets the formality.',
  },
  charcoal: {
    shirt: ['white', 'light blue', 'pink'],
    blazer: ['navy', 'grey', 'black'],
    pants: ['grey', 'black', 'navy'],
    leather: ['black'],
    accent: ['burgundy', 'silver', 'blue'],
    why: 'Charcoal is the sharpest neutral — keep the shirt light and let the accent carry the colour.',
  },
  'light blue': {
    shirt: ['white', 'light blue'],
    blazer: ['navy', 'grey', 'tan'],
    pants: ['navy', 'grey', 'tan'],
    leather: ['brown', 'black'],
    accent: ['navy', 'burgundy'],
    why: 'Light blue brightens everything around it — ground it with navy or grey below.',
  },
  'mid blue': {
    shirt: ['white', 'light blue'],
    blazer: ['navy', 'grey', 'tan'],
    pants: ['grey', 'navy', 'tan'],
    leather: ['brown', 'black'],
    accent: ['navy', 'burgundy', 'mustard'],
    why: 'Mid blue plays well with neutrals — grey and tan keep it easy, navy sharpens it up.',
  },
  navy: {
    shirt: ['white', 'light blue', 'pink'],
    blazer: ['grey', 'tan', 'navy'],
    pants: ['grey', 'tan', 'white'],
    leather: ['brown', 'black', 'burgundy'],
    accent: ['burgundy', 'rust', 'green'],
    why: 'Navy is the classic anchor — brown leather warms it, burgundy and rust give it depth.',
  },
  tan: {
    shirt: ['white', 'light blue', 'pink'],
    blazer: ['navy', 'brown', 'olive'],
    pants: ['navy', 'olive', 'brown', 'white'],
    leather: ['brown', 'tan'],
    accent: ['green', 'navy', 'rust'],
    why: 'Tan is warm and relaxed — navy gives it structure, olive and rust keep it earthy.',
  },
  'mid brown': {
    shirt: ['white', 'light blue', 'cream'],
    blazer: ['tan', 'navy', 'olive'],
    pants: ['tan', 'khaki', 'cream'],
    leather: ['brown', 'tan'],
    accent: ['rust', 'green', 'mustard'],
    why: 'Brown works in warm layers — cream and tan tone in, rust and mustard light it up.',
  },
  chocolate: {
    shirt: ['white', 'cream', 'light blue'],
    blazer: ['tan', 'olive', 'navy'],
    pants: ['tan', 'khaki', 'cream'],
    leather: ['brown', 'tan'],
    accent: ['rust', 'mustard', 'green'],
    why: 'Dark chocolate is rich — cream and tan warm it up, navy keeps it sharp.',
  },
  sage: {
    shirt: ['white', 'cream'],
    blazer: ['navy', 'brown', 'tan'],
    pants: ['navy', 'khaki', 'grey'],
    leather: ['brown', 'tan'],
    accent: ['rust', 'burgundy', 'navy'],
    why: 'Sage is soft — keep the companions muted and let warm leather carry it.',
  },
  olive: {
    shirt: ['white', 'cream', 'light blue'],
    blazer: ['navy', 'brown', 'tan'],
    pants: ['tan', 'khaki', 'navy'],
    leather: ['brown', 'tan'],
    accent: ['rust', 'mustard', 'navy'],
    why: 'Olive is a quiet statement — earth tones agree with it, navy dresses it up.',
  },
  forest: {
    shirt: ['white', 'cream', 'light blue'],
    blazer: ['navy', 'tan', 'brown'],
    pants: ['tan', 'khaki', 'navy'],
    leather: ['brown', 'tan'],
    accent: ['rust', 'mustard', 'burgundy'],
    why: 'Deep green pairs with earth and navy — warm leather ties the whole look together.',
  },
  black: {
    shirt: ['white', 'grey', 'black'],
    blazer: ['black', 'charcoal'],
    pants: ['black', 'charcoal', 'grey'],
    leather: ['black'],
    accent: ['silver', 'burgundy', 'black'],
    why: 'Black wants tonal company — white for contrast, charcoal and silver to keep it modern.',
  },
  white: {
    shirt: ['light blue', 'pink', 'white'],
    blazer: ['navy', 'tan', 'olive'],
    pants: ['navy', 'grey', 'tan', 'olive'],
    leather: ['brown', 'tan', 'black'],
    accent: ['navy', 'green', 'rust'],
    why: 'White is a blank canvas — nearly any jacket and trouser combination sits well against it.',
  },
  cream: {
    shirt: ['light blue', 'white', 'pink'],
    blazer: ['navy', 'tan', 'olive'],
    pants: ['navy', 'olive', 'tan'],
    leather: ['brown', 'tan'],
    accent: ['navy', 'green', 'rust'],
    why: 'Cream is a warm white — earth tones agree with it, navy gives it an edge.',
  },
  pink: {
    shirt: ['white', 'light blue'],
    blazer: ['navy', 'grey', 'charcoal'],
    pants: ['navy', 'grey', 'charcoal'],
    leather: ['brown', 'black'],
    accent: ['navy', 'burgundy'],
    why: 'Pink reads confident against cool neutrals — navy and grey keep it grounded.',
  },
  burgundy: {
    shirt: ['white', 'light blue', 'pink'],
    blazer: ['navy', 'grey', 'charcoal'],
    pants: ['grey', 'navy', 'charcoal'],
    leather: ['black', 'brown'],
    accent: ['navy', 'silver'],
    why: 'Burgundy is rich — let it be the only loud thing and keep everything else neutral.',
  },
};

// Catalogue roles. Rows on the results screen merge via `group`.
const ROLE_DEFS = [
  { category: 'shirt', label: 'Shirts', group: 'Shirts', from: 'shirt', count: 8 },
  { category: 'pants', label: 'Trousers', group: 'Trousers', from: 'pants', count: 8 },
  { category: 'blazer', label: 'Jackets', group: 'Jackets', from: 'blazer', count: 6 },
  { category: 'belt', label: 'Belts', group: 'Belts & Shoes', from: 'leather', count: 4 },
  { category: 'shoes', label: 'Shoes', group: 'Belts & Shoes', from: 'leather', count: 4 },
  { category: 'tie', label: 'Ties', group: 'Ties, Socks & Pocket Squares', from: 'accent', count: 4 },
  { category: 'socks', label: 'Socks', group: 'Ties, Socks & Pocket Squares', from: 'accent', count: 4 },
  { category: 'pocket-square', label: 'Pocket Squares', group: 'Ties, Socks & Pocket Squares', from: 'accent', count: 4 },
];

const OCCASION_ROLES = {
  office: ['shirt', 'pants', 'blazer', 'belt', 'shoes', 'tie', 'socks'],
  social: ['shirt', 'pants', 'blazer', 'belt', 'shoes', 'socks', 'pocket-square'],
  formal: ['shirt', 'pants', 'blazer', 'belt', 'shoes', 'tie', 'socks', 'pocket-square'],
};

// Anchor item excludes its own category (a suit covers jacket + trousers).
const ANCHOR_EXCLUDES = {
  pants: ['pants'],
  shirt: ['shirt'],
  blazer: ['blazer'],
  suit: ['pants', 'blazer'],
  sweater: ['blazer', 'tie', 'pocket-square'],
};

const FORMAL_SHIRTS = ['white', 'light blue', 'cream'];
const cap = (s) => s.replace(/\b\w/g, (ch) => ch.toUpperCase());

function harmonyFor(item, shade, occasion) {
  const h = HARMONY[shade];
  if (!h || !OCCASION_ROLES[occasion] || !ANCHOR_EXCLUDES[item]) return null;
  return h;
}

// The pickable palette (step 5): every colour that works with this shade,
// tagged with the roles it can serve. The customer picks up to two.
export function paletteOptions(item, shade, occasion) {
  const h = harmonyFor(item, shade, occasion);
  if (!h) return null;
  const excluded = new Set(ANCHOR_EXCLUDES[item]);
  const wanted = new Set(OCCASION_ROLES[occasion]);
  const byColour = new Map();
  const add = (colour, role) => {
    if (colour === shade) return;
    if (occasion === 'formal' && role === 'shirt' && !FORMAL_SHIRTS.includes(colour)) return;
    if (!byColour.has(colour)) byColour.set(colour, new Set());
    byColour.get(colour).add(role);
  };
  if (wanted.has('shirt') && !excluded.has('shirt')) for (const c of h.shirt) add(c, 'shirt');
  if (wanted.has('blazer') && !excluded.has('blazer')) for (const c of h.blazer) add(c, 'jacket');
  for (const c of h.accent) add(c, 'accent');
  const options = [...byColour.entries()].map(([name, roles]) => ({
    name: cap(name),
    key: name,
    hex: COLOUR_HEX[name] || '#999',
    roles: [...roles],
  }));
  return { options, why: h.why };
}

// (item, shade, occasion, picks) -> { swatches, roles, why } or null.
// Picked colours lead the role they can serve; matrix defaults fill behind.
export function buildPlan(item, shade, occasion, picks = []) {
  const h = harmonyFor(item, shade, occasion);
  if (!h) return null;
  const excluded = new Set(ANCHOR_EXCLUDES[item]);
  const wanted = new Set(OCCASION_ROLES[occasion]);
  const chosen = picks.filter((p) => HARMONY[shade] && COLOUR_HEX[p]).slice(0, 2);

  const lead = (base, roleKind) => {
    let list = base;
    // Picks that can serve this kind of role jump the queue.
    const opts = paletteOptions(item, shade, occasion);
    const capable = new Set(
      (opts ? opts.options : [])
        .filter((o) => o.roles.includes(roleKind))
        .map((o) => o.key)
    );
    const picked = chosen.filter((p) => capable.has(p));
    if (picked.length) {
      // A pick CONSTRAINS the role to the chosen colours — it doesn't just
      // reorder them. The customer said burgundy; don't show mustard.
      list = [...picked];
      // White always rides along as the safe shirt option.
      if (roleKind === 'shirt' && !list.includes('white')) list.push('white');
    }
    return list;
  };

  const roles = [];
  for (const def of ROLE_DEFS) {
    if (!wanted.has(def.category) || excluded.has(def.category)) continue;
    let colours;
    if (def.from === 'shirt') colours = lead(h.shirt, 'shirt');
    else if (def.from === 'blazer') colours = lead(h.blazer, 'jacket');
    else if (def.from === 'accent') colours = lead(h.accent, 'accent');
    else colours = h[def.from];
    if (occasion === 'formal') {
      if (def.category === 'shirt') colours = colours.filter((c) => FORMAL_SHIRTS.includes(c));
      if (def.category === 'blazer') {
        const dark = colours.filter((c) => ['navy', 'charcoal', 'black'].includes(c));
        if (dark.length) colours = dark;
      }
      if (!colours.length) colours = ['white'];
    }
    roles.push({ category: def.category, label: def.label, group: def.group, colours, count: def.count });
  }

  const itemDef = ANCHOR_ITEMS.find((a) => a.key === item);
  const swatches = [{ name: cap(shade), hex: COLOUR_HEX[shade] || '#999',
    use: 'your ' + (itemDef ? itemDef.label.toLowerCase() : item) }];
  const seen = new Set([shade]);
  for (const p of chosen) {
    if (seen.has(p)) continue;
    seen.add(p);
    swatches.push({ name: cap(p), hex: COLOUR_HEX[p] || '#999', use: 'your pick' });
  }
  for (const role of roles) {
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
