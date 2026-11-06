# @lp-labs/running-regression

Online simple least-squares regression using centered covariance updates and parallel-state merging.

Standalone Node.js >=18 package. ESM and CommonJS with separate strict TypeScript declarations. No runtime, peer or sibling dependencies.

## Install

```sh
npm install @lp-labs/running-regression
```

## Example

```js
import { createRegression } from '@lp-labs/running-regression';
const regression = createRegression();
regression.add(1, 3);
regression.add(2, 5);
regression.add(3, 7);
console.log(regression.fit()); // { slope: 2, intercept: 1 }
console.log(regression.predict(4)); // 9
```

## API, customization, numerical behavior and limits

createRegression returns a Regression with add, merge, snapshot, fit and predict. RegressionState contains count, meanX, meanY, and unnormalized centered sums sxx, sxy, syy. add uses the same centered parallel merge as merging a singleton; merge uses the Chan mean/covariance combination. A maximum 1000000 total observations is enforced. Imported states must be finite, have nonnegative sums, a safe count, canonical empty/singleton forms, and covariance within the Cauchy bound (1e-12 rounding slack). This is structural validation, not proof that arbitrary caller states represent real observations. snapshot is defensive. Failed additions/merges are atomic. fit returns slope=sxy/sxx and intercept=meanY-slope*meanX; fewer than two observations or exactly zero sxx throw RangeError. No arbitrary conditioning threshold is hidden. predict uses the centered form meanY+slope*(x-meanX) but also validates the fit; it does not supply confidence intervals. Nonfinite observations raise TypeError; invalid state, capacity, intermediate/result overflow and rank deficiency raise RangeError. Very large offsets, cancellation and near-rank-deficient data still limit double precision. O(1) time per operation, O(1) storage. No callbacks, weights or multivariate regression.

## Full declarations

```ts
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
  fit(): {
    slope: number;
    intercept: number;
  };
  predict(x: number): number;
}
export declare function createRegression(): Regression;
```

## Development

```sh
npm ci --offline --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

Tests use Node's built-in runner and include independent or analytic reference cases. No runtime global browser access, I/O or hidden dependencies.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
