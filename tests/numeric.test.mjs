import assert from 'node:assert/strict';
import test from 'node:test';
import * as api from '../dist/esm/index.js';
const close = (a, b, tol = 1e-12) =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} != ${b}`);
test('line fit and predict', () => {
  const r = api.createRegression();
  for (let x = 0; x < 10; x++) r.add(x, 2 * x + 1);
  assert.deepEqual(r.fit(), { slope: 2, intercept: 1 });
  assert.equal(r.predict(10), 21);
});
test('stable high offset', () => {
  const r = api.createRegression();
  for (let i = 0; i < 100; i++) r.add(1e12 + i, 3 * i + 2);
  close(r.fit().slope, 3, 1e-12);
  close(r.predict(1e12 + 100), 302, 1e-12);
});
test('merge agrees with batch covariance oracle', () => {
  const a = api.createRegression(),
    b = api.createRegression(),
    all = api.createRegression();
  const xs = Array.from({ length: 100 }, (_, i) => i / 10),
    ys = xs.map((x, i) => 2 * x + Math.sin(i));
  xs.forEach((x, i) => {
    (i < 50 ? a : b).add(x, ys[i]);
    all.add(x, ys[i]);
  });
  a.merge(b.snapshot());
  const mx = xs.reduce((s, x) => s + x, 0) / 100,
    my = ys.reduce((s, y) => s + y, 0) / 100,
    sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0),
    sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  close(a.fit().slope, sxy / sxx);
  close(a.fit().slope, all.fit().slope);
});
test('rank deficiency and invalid input', () => {
  const r = api.createRegression();
  assert.throws(() => r.fit());
  r.add(1, 3);
  assert.throws(() => r.fit());
  r.add(1, 5);
  assert.throws(() => r.fit());
  assert.throws(() => r.add(NaN, 1));
  assert.throws(() => r.predict(Infinity));
});
test('atomic overflow and defensive snapshots', () => {
  const r = api.createRegression();
  r.add(1, 2);
  const before = r.snapshot();
  assert.throws(() => r.add(1e308, 1e308), RangeError);
  assert.deepEqual(r.snapshot(), before);
  const copy = r.snapshot();
  copy.meanX = 999;
  assert.equal(r.snapshot().meanX, 1);
  assert.throws(() => r.merge({ ...before, sxx: -1 }));
  assert.deepEqual(r.snapshot(), before);
});
test('empty merges and count budget', () => {
  const r = api.createRegression();
  r.merge(r.snapshot());
  r.merge({ count: 1000000, meanX: 1, meanY: 2, sxx: 1, sxy: 0, syy: 1 });
  const before = r.snapshot();
  assert.throws(() => r.add(1, 2), RangeError);
  assert.deepEqual(r.snapshot(), before);
  assert.throws(() => r.merge({ count: 0, meanX: 1, meanY: 0, sxx: 0, sxy: 0, syy: 0 }));
  assert.throws(() =>
    api.createRegression().merge({ count: 2, meanX: 0, meanY: 0, sxx: 1, sxy: 2, syy: 1 }),
  );
});
