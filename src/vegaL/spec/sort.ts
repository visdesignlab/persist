import { isArray } from 'lodash';
import { isDateTime } from 'vega-lite/build/src/datetime';
import {
  LogicalAnd,
  LogicalComposition,
  LogicalOr,
  forEachLeaf,
  isLogicalNot
} from 'vega-lite/build/src/logical';
import {
  FieldEqualPredicate,
  FieldRangePredicate,
  Predicate,
  isFieldPredicate
} from 'vega-lite/build/src/predicate';
import {
  SelectionInitIntervalMapping,
  SelectionInitMapping,
  SelectionParameter,
  isSelectionParameter
} from 'vega-lite/build/src/selection';
import { FilterTransform } from 'vega-lite/build/src/transform';
import { Interactions } from '../../interactions/types';
import { objectToKeyValuePairs } from '../../utils/objectToKeyValuePairs';
import { VegaLiteSpecProcessor } from './processor';
import { isSelectionInterval, removeParameterValue } from './selection';
import { isPrimitiveValue } from './spec';
import { AnyUnitSpec } from './view';

export type Sort = LogicalComposition<Predicate>;
export type SortDirection = 'ascending' | 'descending';

const NON_NULL_FORCE_STRING = '__NON_NULL_FORCE_STRING__';

/**
 * @param vlProc - processor object
 * @returns processor object
 *
 * NOTE: filter operations only adds one layer
 */
export function applySort(
  vlProc: VegaLiteSpecProcessor,
  sortAction: Interactions.SortAction
): VegaLiteSpecProcessor {
  const { direction, col } = sortAction;

  // get all params
  const { params } = vlProc;

  return vlProc;
}

export function addFilterTransform(
  spec: AnyUnitSpec,
  filter: Sort
): AnyUnitSpec {
  const { transform = [] } = spec;

  const filterTransform = createFilterTransform(filter);

  transform.push(filterTransform);

  spec.transform = transform;

  return spec;
}

/**
 * @param selection - a vegalite selection mapping
 * @returns array of filter range predicates for each selection in the mapping
 */
function createFRPredicate(
  selection: SelectionInitIntervalMapping
): FieldRangePredicate[] {
  const selections = objectToKeyValuePairs(selection);

  return selections.map(({ key, value }) => ({
    field: key,
    range: value as any
  }));
}

/**
 * @param selection - a vegalite selection mapping
 * @returns array of filter equal predicates for each selection in the mapping
 *
 * **NOTE** - currently assumes all values in `selection` are non-null, so replacing value with `NON_NULL_FORCE_STRING`
 */
function createFEPredicates(
  selection: SelectionInitMapping
): FieldEqualPredicate[] {
  return objectToKeyValuePairs(selection).map(
    ({ key, value = NON_NULL_FORCE_STRING }) => ({
      field: key,
      equal: value as any
    })
  );
}

function createFilterTransform(
  filterPredicate: LogicalComposition<Predicate>
): FilterTransform {
  return {
    filter: filterPredicate
  };
}

export function createLogicalAndPredicate(
  predicates: Array<LogicalComposition<Predicate>>
): LogicalAnd<Predicate> {
  return {
    and: predicates
  };
}

export function createLogicalOrPredicate(
  predicates: Array<LogicalComposition<Predicate>>
): LogicalOr<Predicate> {
  return {
    or: predicates
  };
}

export function extractFilterFields(
  filters: FilterTransform | FilterTransform[]
) {
  filters = isArray(filters) ? filters : [filters];

  const fields: string[] = [];

  filters.forEach(f => {
    forEachLeaf(f.filter, predicate => {
      if (isFieldPredicate(predicate)) {
        fields.push(predicate.field);
      }
    });
  });

  return [...new Set(fields)];
}
