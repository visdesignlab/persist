import { JSONPatchReplace, immutableJSONPatch } from 'immutable-json-patch';
import { JSONPath } from 'jsonpath-plus';
import { TopLevelSpec } from 'vega-lite';
import { isUnitSpec } from 'vega-lite/build/src/spec';
import { TopLevelParameter } from 'vega-lite/build/src/spec/toplevel';
import { deepClone } from '../../utils/deepClone';
import { JSONPathResult } from '../../utils/jsonpath';
import { LayerSpec } from './spec';
import { AnyUnitSpec } from './view';

type ViewObject = {
  spec: {
    layer: LayerSpec['layer'];
  };
  path: string;
  base: AnyUnitSpec;
};

type UnitSpecCallback = (spec: AnyUnitSpec) => AnyUnitSpec;
type ParamCallback = (param: TopLevelParameter) => TopLevelParameter;

export class VegaLiteSpecProcessor {
  static init(
    spec: TopLevelSpec,
    unitSpecJSONPath: string = this.DEFAULT_UNIT_SPEC_JSON_PATH
  ) {
    return new VegaLiteSpecProcessor(spec, unitSpecJSONPath);
  }
  static readonly DEFAULT_UNIT_SPEC_JSON_PATH = '$..*[?(@property==="mark")]^';

  private readonly _rawSpec: TopLevelSpec;

  private readonly _baseSpec: TopLevelSpec;

  private readonly _PATH: string =
    VegaLiteSpecProcessor.DEFAULT_UNIT_SPEC_JSON_PATH;

  private readonly _viewLayerSpecs: Array<ViewObject> = [];
  private readonly _layerFns = new Map<string, Array<UnitSpecCallback>>();

  private constructor(spec: TopLevelSpec, unitSpecJSONPath: string) {
    this._rawSpec = deepClone(spec);
    this._baseSpec = deepClone(spec);

    this._PATH = unitSpecJSONPath;

    const specs: JSONPathResult<AnyUnitSpec> = JSONPath({
      json: this._baseSpec,
      path: this._PATH,
      resultType: 'all'
    });

    specs.forEach(specPath => {
      const { value: spec, pointer } = specPath;
      if (!isUnitSpec(spec)) throw new Error('Should not enter here.');

      const layerObject: ViewObject = {
        base: spec,
        spec: {
          layer: []
        },
        path: pointer
      };

      this._viewLayerSpecs.push(layerObject);
    });
  }

  get unitSpecJSONPath() {
    return this._PATH;
  }

  get rawSpec() {
    return this._rawSpec;
  }

  get baseSpec(): TopLevelSpec {
    return this._baseSpec;
  }

  get spec(): TopLevelSpec {
    return this._process();
  }

  get params() {
    if (!this._baseSpec.params) this._baseSpec.params = [];
    return this._baseSpec.params;
  }
  set params(params: TopLevelParameter[]) {
    this._baseSpec.params = params;
  }

  updateTopLevelParameter(cb: ParamCallback = p => p) {
    this.params = this.params.map(p => cb(p));
  }

  addLayer(name: string, cb: UnitSpecCallback = s => s) {
    let layerFns = this._layerFns.get(name) || [];

    this._layerFns.set(name, [...layerFns, cb]);
  }

  private _process(): TopLevelSpec {
    if (this._layerFns.size === 0) {
      this.addLayer('BASE');
    }

    const updatedLayerSpecs = this._viewLayerSpecs.map(_view => {
      const view = deepClone(_view);

      const { spec, base } = view;

      this._layerFns.forEach(fns => {
        const updatedSpec = fns.reduce((acc, fn) => fn(acc), base);

        spec.layer.push(updatedSpec);
      });

      view.spec = spec;

      console.log(view.path, spec);
      return view;
    });

    const patches: Array<JSONPatchReplace> = [];

    updatedLayerSpecs.forEach(({ path, spec }) => {
      patches.push({
        op: 'replace',
        path,
        value: spec as any
      });
    });

    const topSpec: TopLevelSpec = immutableJSONPatch(
      deepClone(this._baseSpec) as any,
      deepClone(patches)
    ) as any;

    return topSpec;
  }
}
