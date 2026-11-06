export interface RegressionState {
  count: number;
  meanX: number;
  meanY: number;
  sxx: number;
  sxy: number;
  syy: number;
}
export interface Regression {
  add(x: number, y: number): void;
  merge(state: RegressionState): void;
  snapshot(): RegressionState;
  fit(): { slope: number; intercept: number };
  predict(x: number): number;
}
function checked(s: RegressionState): RegressionState {
  if (
    !Number.isSafeInteger(s.count) ||
    s.count < 0 ||
    s.count > 1_000_000 ||
    ![s.meanX, s.meanY, s.sxx, s.sxy, s.syy].every(Number.isFinite) ||
    s.sxx < 0 ||
    s.syy < 0
  )
    throw new RangeError('Invalid or overflowing regression state.');
  if (s.count === 0 && [s.meanX, s.meanY, s.sxx, s.sxy, s.syy].some((x) => x !== 0))
    throw new RangeError('Noncanonical empty state.');
  if (s.count === 1 && (s.sxx !== 0 || s.sxy !== 0 || s.syy !== 0))
    throw new RangeError('Invalid singleton state.');
  if (Math.abs(s.sxy) > Math.sqrt(s.sxx) * Math.sqrt(s.syy) * (1 + 1e-12))
    throw new RangeError('Invalid covariance.');
  return { ...s };
}
export function createRegression(): Regression {
  let state: RegressionState = { count: 0, meanX: 0, meanY: 0, sxx: 0, sxy: 0, syy: 0 };
  const merge = (input: RegressionState) => {
    const b = checked(input),
      a = state;
    if (!b.count) return;
    if (!a.count) {
      state = b;
      return;
    }
    const count = a.count + b.count,
      dx = b.meanX - a.meanX,
      dy = b.meanY - a.meanY,
      w = a.count * (b.count / count);
    state = checked({
      count,
      meanX: a.meanX + dx * (b.count / count),
      meanY: a.meanY + dy * (b.count / count),
      sxx: a.sxx + b.sxx + dx * dx * w,
      sxy: a.sxy + b.sxy + dx * dy * w,
      syy: a.syy + b.syy + dy * dy * w,
    });
  };
  const fit = () => {
    if (state.count < 2 || state.sxx === 0) throw new RangeError('Rank deficient regression.');
    const slope = state.sxy / state.sxx,
      intercept = state.meanY - slope * state.meanX;
    if (!Number.isFinite(slope) || !Number.isFinite(intercept))
      throw new RangeError('Fit overflow.');
    return { slope, intercept };
  };
  return {
    add(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y))
        throw new TypeError('Observations must be finite.');
      merge({ count: 1, meanX: x, meanY: y, sxx: 0, sxy: 0, syy: 0 });
    },
    merge,
    snapshot() {
      return { ...state };
    },
    fit,
    predict(x) {
      if (!Number.isFinite(x)) throw new TypeError('x must be finite.');
      const f = fit(),
        y = state.meanY + f.slope * (x - state.meanX);
      if (!Number.isFinite(y)) throw new RangeError('Prediction overflow.');
      return y;
    },
  };
}
