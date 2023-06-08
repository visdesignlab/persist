import { TopLevelSpec } from 'vega-lite';
import { TrrackableCellId } from '../../cells';

export type GeneralChartTypes = {};

export class BetterProcessor {
  private _spec: TopLevelSpec;
  private _id: TrrackableCellId;

  constructor(spec: TopLevelSpec, id: TrrackableCellId) {
    this._spec = spec;
    this._id = id;
  }

  get id() {
    return this._id;
  }

  get spec() {
    return this._spec;
  }
}
