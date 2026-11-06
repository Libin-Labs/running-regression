import * as api from '@lp-labs/running-regression';
const regression: api.Regression = api.createRegression();
regression.add(1, 2);
regression.add(2, 4);
const state: api.RegressionState = regression.snapshot();
regression.merge(state);
regression.fit();
regression.predict(3);
// @ts-expect-error Invalid API input must be rejected.
api.createRegression().add('x', 1);
