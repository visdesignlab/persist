import { Interactions } from '../../interactions/types';
import { VegaLiteSpecProcessor } from './processor';

export function applyRenameColumn(
  vlProc: VegaLiteSpecProcessor,
  _categoryAction: Interactions.RenameColumnAction
) {
  vlProc.addLayer('BASE', spec => {
    const { transform = [] } = spec;

    spec.transform = transform;

    return spec;
  });

  return vlProc;
}
