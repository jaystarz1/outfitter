import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, ANCHOR_COLOURS, ANCHOR_ITEMS, OCCASIONS, COLOUR_HEX } from '../src/palette.js';

test('every anchor item x colour x occasion produces a plan', () => {
  for (const item of ANCHOR_ITEMS) {
    for (const colour of ANCHOR_COLOURS) {
      for (const occ of OCCASIONS) {
        const plan = buildPlan(item.key, colour, occ.key);
        assert.ok(plan, `${item.key}/${colour}/${occ.key}`);
        assert.ok(plan.roles.length >= 3, `${item.key}/${colour}/${occ.key} has roles`);
        assert.ok(plan.why.length > 10);
        assert.ok(plan.swatches.length >= 3);
      }
    }
  }
});

test('anchor category is never recommended back', () => {
  const plan = buildPlan('pants', 'grey', 'office');
  assert.ok(!plan.roles.some((r) => r.category === 'pants'));
  const suit = buildPlan('suit', 'navy', 'formal');
  assert.ok(!suit.roles.some((r) => r.category === 'pants' || r.category === 'blazer'));
});

test('occasion controls accents: office=tie, social=pocket square, formal=both', () => {
  const cats = (o) => buildPlan('pants', 'navy', o).roles.map((r) => r.category);
  assert.ok(cats('office').includes('tie') && !cats('office').includes('pocket-square'));
  assert.ok(cats('social').includes('pocket-square') && !cats('social').includes('tie'));
  assert.ok(cats('formal').includes('tie') && cats('formal').includes('pocket-square'));
});

test('formal restricts shirts to dress colours', () => {
  for (const colour of ANCHOR_COLOURS) {
    const shirt = buildPlan('pants', colour, 'formal').roles.find((r) => r.category === 'shirt');
    if (!shirt) continue;
    for (const c of shirt.colours) {
      assert.ok(['white', 'light blue', 'cream'].includes(c), `${colour} formal shirt got ${c}`);
    }
  }
});

test('all swatch hexes resolve', () => {
  for (const colour of ANCHOR_COLOURS) {
    const plan = buildPlan('shirt', colour, 'social');
    for (const s of plan.swatches) {
      assert.match(s.hex, /^#[0-9A-Fa-f]{6}$/, `${colour}: ${s.name} -> ${s.hex}`);
    }
  }
  assert.ok(COLOUR_HEX.navy);
});

test('unknown inputs return null', () => {
  assert.equal(buildPlan('hat', 'grey', 'office'), null);
  assert.equal(buildPlan('pants', 'chartreuse', 'office'), null);
  assert.equal(buildPlan('pants', 'grey', 'gala'), null);
});
