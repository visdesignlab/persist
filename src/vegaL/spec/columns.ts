import { CalculateTransform } from 'vega-lite/build/src/transform';
import { Interactions } from '../../interactions/types';
import { addEncoding, getFieldNamesFromEncoding } from './encoding';
import { VegaLiteSpecProcessor } from './processor';

export function applyRenameColumn(
  vlProc: VegaLiteSpecProcessor,
  { prev_column_name, new_column_name }: Interactions.RenameColumnAction
) {
  vlProc.addLayer('BASE', spec => {
    const { transform = [] } = spec;

    const calculate: CalculateTransform = {
      calculate: `"datum[${prev_column_name}]"`,
      as: `"${new_column_name}"`
    };

    transform.push(calculate);

    const fields = getFieldNamesFromEncoding(
      spec.encoding || {},
      Object.keys(spec.encoding || {}) as any
    );

    Object.entries(fields as any).forEach(([key, val]: any[]) => {
      if (val === prev_column_name) {
        const encoding: any = spec.encoding || {};
        spec.encoding = addEncoding(encoding, key, {
          ...encoding[key],
          title: new_column_name
        });
      }
    });

    spec.transform = transform;

    return spec;
  });

  return vlProc;
}
