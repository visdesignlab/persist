import { CalculateTransform } from 'vega-lite/build/src/transform';
import { Interactions } from '../../interactions/types';
import { addEncoding, getFieldNamesFromEncoding } from './encoding';
import { VegaLiteSpecProcessor } from './processor';
import { BASE_LAYER } from './spec';

export function applyRenameColumn(
  vlProc: VegaLiteSpecProcessor,
  { prevColumnName, newColumnName }: Interactions.RenameColumnAction
) {
  vlProc.addLayer(BASE_LAYER, spec => {
    const { transform = [] } = spec;

    const calculate: CalculateTransform = {
      calculate: `"datum[${prevColumnName}]"`,
      as: `"${newColumnName}"`
    };

    transform.push(calculate);

    const fields = getFieldNamesFromEncoding(
      spec.encoding || {},
      Object.keys(spec.encoding || {}) as any
    );

    Object.entries(fields as any).forEach(([key, val]: any[]) => {
      if (val === prevColumnName) {
        const encoding: any = spec.encoding || {};
        spec.encoding = addEncoding(encoding, key, {
          ...encoding[key],
          title: newColumnName
        });
      }
    });

    spec.transform = transform;

    return spec;
  });

  console.log(vlProc.spec);

  return vlProc;
}

/**
 * TODO: Add error handling?
 */
export function applyDropColumns(
  vlProc: VegaLiteSpecProcessor,
  { columnNames }: Interactions.DropColumnAction
) {
  vlProc.addLayer('BASE', spec => {
    const fields = getFieldNamesFromEncoding(
      spec.encoding || {},
      Object.keys(spec.encoding || {}) as any
    );

    const fieldNames = Object.values(fields as any) as string[];

    columnNames.forEach(col => {
      if (fieldNames.includes(col)) {
        throw new Error(`Column ${col} is dropped from the dataset.`);
      }
    });

    return spec;
  });

  return vlProc;
}
