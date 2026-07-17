import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProduct } from '../src/sync.js';

const store = { slug: 'test' };
const NOW = '2026-07-16T00:00:00Z';

function make(overrides) {
  return {
    id: 1,
    handle: 'h',
    title: 'Thing',
    tags: [],
    variants: [{ id: 10, price: '99.00', available: true }],
    images: [],
    ...overrides,
  };
}

test('Tip Top KEY--value tags drive colour/fit/category', () => {
  const p = normalizeProduct(store, make({
    title: 'Modern Fit Geo Print Non-Iron Dress Shirt',
    product_type: 'Patterned Dress Shirts',
    tags: ['COLOR--Blue-Bleu', 'FIT--Modern Fit', 'Category--DRESS SHIRTS'],
  }), NOW);
  assert.equal(p.category, 'shirt');
  assert.deepEqual(JSON.parse(p.colours), ['blue']);
  assert.equal(p.fit, 'Modern Fit');
});

test('suit pants categorize as pants, not suit', () => {
  const p = normalizeProduct(store, make({
    title: 'Modern Fit Cognac Solid Suit Pants',
    product_type: 'Suit Pants',
  }), NOW);
  assert.equal(p.category, 'pants');
});

test('suit vest categorizes as vest', () => {
  const p = normalizeProduct(store, make({ title: 'Wool Suit Vest', product_type: 'Suit Vests' }), NOW);
  assert.equal(p.category, 'vest');
});

test('full suit bundle stays suit', () => {
  const p = normalizeProduct(store, make({ title: 'Slim Fit Steel Blue Solid Suit', product_type: 'Suit Bundle' }), NOW);
  assert.equal(p.category, 'suit');
});

test('plural product_type "Shirts" matches shirt', () => {
  const p = normalizeProduct(store, make({ title: 'Modern Fit Stretch Dobby', product_type: 'Patterned Dress Shirts' }), NOW);
  assert.equal(p.category, 'shirt');
});

test('lapel pins and cuff links are accessories', () => {
  assert.equal(normalizeProduct(store, make({ title: 'Gummy Bear Lapel Pin', product_type: 'Lapel Pins' }), NOW).category, 'accessory');
  assert.equal(normalizeProduct(store, make({ title: 'Square Jewel Cuff Links', product_type: 'Cuff Links' }), NOW).category, 'accessory');
});

test('generic store without structured tags: colour from title', () => {
  const p = normalizeProduct(store, make({ title: 'Navy Twill Chino', product_type: 'Bottoms' }), NOW);
  assert.equal(p.category, 'pants');
  assert.ok(JSON.parse(p.colours).includes('navy'));
});

test('sale detection from compare_at_price', () => {
  const p = normalizeProduct(store, make({
    variants: [{ id: 10, price: '59.00', compare_at_price: '89.00', available: true }],
  }), NOW);
  assert.equal(p.on_sale, 1);
  assert.equal(p.price_min, 59);
  assert.equal(p.compare_at_price, 89);
});

test('out of stock when no variant available', () => {
  const p = normalizeProduct(store, make({ variants: [{ id: 10, price: '10', available: false }] }), NOW);
  assert.equal(p.in_stock, 0);
});
