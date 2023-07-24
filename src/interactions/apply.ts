/* eslint-disable @typescript-eslint/no-non-null-assertion */

import embed from 'vega-embed';
import { TopLevelSpec, compile } from 'vega-lite';

import { isSelectionParameter } from 'vega-lite/build/src/selection';
import { TrrackableCellId } from '../cells';
import { VegaLiteSpecProcessor } from '../vegaL/spec';
import { applyAggregate } from '../vegaL/spec/aggregate';
import { applyFilter } from '../vegaL/spec/filter';
import { Interaction, Interactions } from './types';
import { applyCategory } from '../vegaL/spec/categorize';

export class ApplyInteractions {
  static cache: Map<TopLevelSpec, Map<Interaction, TopLevelSpec>> = new Map();
  _id: string;

  constructor(private interactions: Interactions, _id: TrrackableCellId) {
    this._id = _id;
  }

  apply(spec: TopLevelSpec) {
    const vlProc = VegaLiteSpecProcessor.init(spec);

    this.interactions.forEach(interaction => {
      this.applyInteraction(vlProc, interaction);
    });

    return vlProc.spec;
  }

  applyInteraction(vlProc: VegaLiteSpecProcessor, interaction: Interaction) {
    switch (interaction.type) {
      case 'selection':
        this.applySelection(vlProc, interaction);
        break;
      case 'filter':
        vlProc = applyFilter(vlProc, interaction);
        break;
      case 'aggregate':
        vlProc = applyAggregate(vlProc, interaction);
        break;
      case 'categorize':
        vlProc = applyCategory(vlProc, interaction);
        console.log('categorize', vlProc.spec);
        break;
      default:
        break;
    }
  }

  applySelection(
    vlProc: VegaLiteSpecProcessor,
    selection: Interactions.SelectionAction
  ) {
    vlProc.updateTopLevelParameter(param => {
      if (isSelectionParameter(param) && param.name === selection.name) {
        param.value = selection.value;
      }

      return param;
    });
  }

  // // TODO: Handle for legend binding
  // applyAggregate(
  //   vlProc: VegaLiteSpecProcessor,
  //   aggregate: Interactions.AggregateAction
  // ) {
  //   const AGG_NAME = aggregate.agg_name;

  //   const params = vlProc.params;

  //   const selections = params.filter(isSelectionParameter);
  //   const outFilter = getCompositeOutFilterFromSelections(selections);
  //   const inFilter = invertFilter(outFilter);

  //   vlProc.updateTopLevelParameter(p => {
  //     if (isSelectionParameter(p)) {
  //       delete p.value;
  //     }
  //     return p;
  //   });

  //   function addFilterOutLayer(spec: AnyUnitSpec) {
  //     const { transform = [] } = spec;

  //     transform.push(outFilter);

  //     spec.transform = mergeFilters(transform);

  //     return spec;
  //   }

  //   vlProc.addLayer(outFilterLayer, addFilterOutLayer);

  //   function addFilterInLayer(spec: AnyUnitSpec) {
  //     const { transform = [] } = spec;

  //     transform.push(inFilter); // add new filters

  //     spec.transform = mergeFilters(transform, 'and');

  //     const markType = isMarkDef(spec.mark) ? spec.mark.type : '';

  //     spec.encoding = addEncoding(spec.encoding, 'fillOpacity', {
  //       value: 0.2
  //     });
  //     spec.encoding = addEncoding(spec.encoding, 'strokeOpacity', {
  //       value: 0.8
  //     });

  //     spec.encoding = addEncoding(spec.encoding, 'opacity', {
  //       value: 0.2
  //     });

  //     if (markType === 'point' || markType === 'circle') {
  //       spec.encoding = removeEncoding(spec.encoding, 'fillOpacity');
  //       spec.encoding = removeEncoding(spec.encoding, 'strokeOpacity');
  //       spec.encoding = removeEncoding(spec.encoding, 'color');
  //     }

  //     return pipe(
  //       removeUnitSpecName,
  //       removeUnitSpecSelectionParams,
  //       removeUnitSpecSelectionFilters
  //     )(spec);
  //   }

  //   vlProc.addLayer(AGG_NAME + 'IN', addFilterInLayer);

  //   function addAggregateLayer(spec: AnyUnitSpec) {
  //     const { transform = [] } = spec;

  //     transform.push(inFilter); // filter in the selected points

  //     const fields = vlProc.encodingFields;

  //     const markType = isMarkDef(spec.mark) ? spec.mark.type : '';

  //     if (markType === 'point' || markType === 'circle') {
  //       spec.encoding = addEncoding(spec.encoding, 'size', {
  //         value: 400
  //       });
  //       spec.encoding = removeEncoding(spec.encoding, 'fillOpacity');
  //       spec.encoding = removeEncoding(spec.encoding, 'strokeOpacity');
  //     } else {
  //       spec.encoding = removeEncoding(spec.encoding, 'opacity');
  //     }

  //     const agg: JoinAggregateTransform = {
  //       joinaggregate: fields.map(({ field }) => {
  //         return {
  //           field,
  //           as: field,
  //           op: 'mean'
  //         };
  //       })
  //     };

  //     const calc: CalculateTransform[] = fields
  //       .filter(f => f.type === 'nominal')
  //       .map(({ field }) => ({
  //         calculate: `"${AGG_NAME}"`,
  //         as: field
  //       }));

  //     transform.push(agg);
  //     transform.push(...calc);

  //     console.log(transform);

  //     spec.transform = mergeFilters(transform);

  //     return pipe(
  //       removeUnitSpecName,
  //       removeUnitSpecSelectionParams,
  //       removeUnitSpecSelectionFilters
  //     )(spec);
  //   }

  //   vlProc.addLayer(AGG_NAME + 'AGG', addAggregateLayer);
  // }
}

export async function getDataFromVegaSpec(spc: any, _opt = true) {
  if (_opt) {
    return [];
  }

  const div = document.createElement('div');
  const vg = compile(spc as any);

  const { view } = await embed(div, vg.spec);

  const dataState = view.getState({
    data: (n?: string) => {
      return !!n;
    }
  }).data;

  const dataSources = Object.keys(dataState)
    .filter(d => d.startsWith('data_'))
    .sort()
    .reverse();

  const finalDatasetName = dataSources[0];

  const sourceData = view.data('source_0');
  const finalData = view.data(finalDatasetName);

  const data = [...sourceData, ...finalData];

  view.finalize();
  div.remove();

  return data;
}
