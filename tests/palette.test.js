import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlan, paletteOptions, FAMILIES, ALL_SHADES, ANCHOR_ITEMS, OCCASIONS, COLOUR_HEX,
} from '../src/palette.js';

test('every item x shade x occasion produces a plan and palette options', () => {
  for (const item of ANCHOR_ITEMS) {
    for (const shade of ALL_SHADES) {
      for (const occ of OCCASIONS) {
        const plan = buildPlan(item.key, shade, occ.key);
        assert.ok(plan, `${item.key}/${shade}/${occ.key}`);
        assert.ok(plan.roles.length >= 3, `${item.key}/${shade}/${occ.key} has roles`);
        assert.ok(plan.why.length > 10);
        assert.ok(plan.swatches.length >= 3);
        const opts = paletteOptions(item.key, shade, occ.key);
        assert.ok(opts.options.length >= 3, `${item.key}/${shade}/${occ.key} pickable options`);
        for (const o of opts.options) {
          assert.notEqual(o.key, shade, 'anchor shade never offered as a pick');
          assert.ok(o.roles.length >= 1);
          assert.match(o.hex, /^#[0-9A-Fa-f]{6}$/);
        }
      }
    }
  }
});

test('every family shade has a hex and a harmony entry', () => {
  for (const f of FAMILIES) {
    assert.ok(f.shades.length >= 1);
    for (const s of f.shades) {
      assert.ok(COLOUR_HEX[s], `${s} hex`);
      assert.ok(buildPlan('pants', s, 'office'), `${s} harmony`);
    }
  }
});

test('picked colours lead their roles', () => {
  const base = buildPlan('pants', 'charcoal', 'office');
  const baseShirt = base.roles.find((r) => r.category === 'shirt');
  assert.notEqual(baseShirt.colours[0], 'pink');
  const picked = buildPlan('pants', 'charcoal', 'office', ['pink', 'burgundy']);
  const shirt = picked.roles.find((r) => r.category === 'shirt');
  assert.equal(shirt.colours[0], 'pink');
  assert.ok(shirt.colours.includes('white'), 'white rides along as the safety');
  const tie = picked.roles.find((r) => r.category === 'tie');
  assert.equal(tie.colours[0], 'burgundy');
});

test('anchor category is never recommended back', () => {
  const plan = buildPlan('pants', 'mid grey', 'office');
  assert.ok(!plan.roles.some((r) => r.category === 'pants'));
  const suit = buildPlan('suit', 'navy', 'formal');
  assert.ok(!suit.roles.some((r) => r.category === 'pants' || r.category === 'blazer'));
});

test('occasion controls accents: office=tie, social=pocket square, formal=both; socks everywhere', () => {
  const cats = (o) => buildPlan('pants', 'navy', o).roles.map((r) => r.category);
  assert.ok(cats('office').includes('tie') && !cats('office').includes('pocket-square'));
  assert.ok(cats('social').includes('pocket-square') && !cats('social').includes('tie'));
  assert.ok(cats('formal').includes('tie') && cats('formal').includes('pocket-square'));
  for (const o of ['office', 'social', 'formal']) assert.ok(cats(o).includes('socks'));
});

test('formal restricts shirts to dress colours even when picks disagree', () => {
  for (const shade of ALL_SHADES) {
    const shirt = buildPlan('pants', shade, 'formal', ['rust', 'mustard'])
      .roles.find((r) => r.category === 'shirt');
    if (!shirt) continue;
    for (const c of shirt.colours) {
      assert.ok(['white', 'light blue', 'cream'].includes(c), `${shade} formal shirt got ${c}`);
    }
  }
});

test('roles carry display groups for carousel rows', () => {
  const plan = buildPlan('pants', 'mid grey', 'formal');
  const groups = new Set(plan.roles.map((r) => r.group));
  assert.ok(groups.has('Belts & Shoes'));
  assert.ok(groups.has('Ties, Socks & Pocket Squares'));
});

test('unknown inputs return null', () => {
  assert.equal(buildPlan('hat', 'mid grey', 'office'), null);
  assert.equal(buildPlan('pants', 'chartreuse', 'office'), null);
  assert.equal(buildPlan('pants', 'mid grey', 'gala'), null);
  assert.equal(paletteOptions('pants', 'chartreuse', 'office'), null);
});
