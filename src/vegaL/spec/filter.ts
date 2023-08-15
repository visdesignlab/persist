import { isArray, isNumber } from 'lodash';
import {
  isFieldDef,
  isRepeatRef,
  vgField
} from 'vega-lite/build/src/channeldef';
import { isDateTime } from 'vega-lite/build/src/datetime';
import {
  LogicalAnd,
  LogicalComposition,
  LogicalOr,
  forEachLeaf,
  isLogicalAnd,
  isLogicalNot,
  isLogicalOr
} from 'vega-lite/build/src/logical';
import {
  FieldEqualPredicate,
  FieldOneOfPredicate,
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
import { SelectionInteractionGroups } from '../../interactions/apply';
import { Interactions } from '../../interactions/types';
import { deepClone } from '../../utils/deepClone';
import { objectToKeyValuePairs } from '../../utils/objectToKeyValuePairs';
import { VegaLiteSpecProcessor } from './processor';
import {
  convertTimeStampIntervalToDateTime,
  isSelectionInterval,
  removeParameterValue
} from './selection';
import { BASE_LAYER, isPrimitiveValue } from './spec';
import { AnyUnitSpec } from './view';

export const OUT_FILTER_LAYER = '__OUT_FILTER_LAYER__';
export const IN_FILTER_LAYER = '__IN_FILTER_LAYER__';

export type Filter = LogicalComposition<Predicate>;
export type FilterDirection = 'in' | 'out';

const NON_NULL_FORCE_STRING = '__NON_NULL_FORCE_STRING__';

export const IS_RANGE_PREDICATE = <T extends any | number>(
  arr: T[]
): arr is [T, T] => {
  return arr.length === 2;
};

// Copied from vegalite channeldef

/**
 * @param vlProc - processor object
 * @returns processor object
 *
 * NOTE: always added to base layer
 */
export function applyFilter(
  vlProc: VegaLiteSpecProcessor,
  filterAction: Interactions.FilterAction
): VegaLiteSpecProcessor {
  const { direction } = filterAction;

  // get all params
  const { params } = vlProc;

  const timeUnitEncodings: string[] = [];

  vlProc.encodings.forEach(f => {
    if (!isRepeatRef(f) && isFieldDef(f)) {
      const { timeUnit } = f;

      if (timeUnit) {
        timeUnitEncodings.push(vgField(f as any));
      }
    }
  });

  // filter selections
  let selections = deepClone(params.filter(isSelectionParameter));

  if (timeUnitEncodings.length > 0) {
    console.warn('Some issues handling datetime. to debug');

    selections = selections.map(s => {
      const { value } = s;

      if (value && typeof value === 'object' && !isDateTime(value)) {
        if (isArray(value)) {
          //
        } else {
          s.value = convertTimeStampIntervalToDateTime(
            value,
            timeUnitEncodings
          );
        }
      }

      return s;
    });
  }

  // create filters from selections
  const filterPredicates = getFiltersFromSelections(selections);

  // combine the filters using OR
  const combinedPredicate = createLogicalOrPredicate(filterPredicates);

  // remove values from all selections
  vlProc.updateTopLevelParameter(param =>
    isSelectionParameter(param) ? removeParameterValue(param) : param
  );

  // Add the base layer which is the layer with filter transform
  vlProc.addLayer(BASE_LAYER, spec =>
    addFilterTransform(
      spec,
      direction === 'out' ? invertFilter(combinedPredicate) : combinedPredicate // invert if direction is out
    )
  );

  return vlProc;
}

/**
 * @param spec - unit spec to modify
 * @param filter - filter predicate to add as transform
 * @returns modified unit spec
 */
export function addFilterTransform(
  spec: AnyUnitSpec,
  filters: Filter | Filter[]
): AnyUnitSpec {
  const { transform = [] } = spec;

  const filter = isArray(filters) ? filters : [filters];

  const filterTransforms = filter.map(createFilterTransform);

  transform.push(...filterTransforms);

  spec.transform = transform;

  return spec;
}

/**
 * @param selections - List of selection parameters from vega-lite
 * @returns Flattened list of filter predicates for selections
 */
export function getFiltersFromSelections(
  selections: SelectionParameter[],
  dateTime: string[] = []
): Filter[] {
  const filters = selections
    .map(selection => getFiltersFromSelection(selection, dateTime))
    .flat();

  return filters;
}

/**
 * @param selection - A single selection from vegalite
 * @returns list of filter predicates for the selection.
 */
export function getFiltersFromSelection(
  selection: SelectionParameter,
  _dateTime: string[] = []
): Filter[] {
  const value = selection.value; // get value from the selection object

  const filters: Filter[] = [];

  // if the value is just value, decide what to do.
  // Maybe this is just a regular param & not selection.
  if (isPrimitiveValue(value) || isDateTime(value)) {
    // TODO: Figure out what to do?
    throw new Error(`Cannot handle: ${value}`);
  } else if (isArray(value)) {
    // this implies point selection
    // value is array of mappings between field names and selected items
    // create filter predicates for each entry & flatten

    const predicates = value.map(createFEPredicates).flat();

    filters.push(...predicates);
  } else if (typeof value === 'object') {
    // this implied range selection
    // value is map of field names to array of selection intervals probably

    const allSelectionPairs = Object.entries(value);

    const isNumericRange = allSelectionPairs.every(v =>
      [...v[1]].every(isNumber)
    );

    const isStartEndRange = allSelectionPairs.every(v => v[1].length === 2);

    const rangePredicates =
      isNumericRange && isStartEndRange
        ? createFRPredicate(value)
        : createFOFPredicate(value);

    // if selection interval combine all with and
    const finalPredicates = isSelectionInterval(selection)
      ? [createLogicalAndPredicate(rangePredicates)]
      : rangePredicates;

    filters.push(...finalPredicates);
  }

  return filters;
}

export function invertFilter(predicate: Filter): Filter {
  return isLogicalNot(predicate)
    ? predicate.not
    : {
        not: predicate
      };
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

function createFOFPredicate(
  selection: SelectionInitIntervalMapping
): FieldOneOfPredicate[] {
  const selections = objectToKeyValuePairs(selection);

  return selections.map(({ key, value }) => ({
    field: key,
    oneOf: value
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
  const preds = predicates.filter(p => {
    if (isLogicalAnd(p)) {
      return p.and.length > 0;
    }
    if (isLogicalOr(p)) {
      return p.or.length > 0;
    }

    return Boolean(p);
  });

  return {
    and: preds
  };
}

export function createLogicalOrPredicate(
  predicates: Array<LogicalComposition<Predicate>>
): LogicalOr<Predicate> {
  const preds = predicates.filter(p => {
    if (isLogicalAnd(p)) {
      return p.and.length > 0;
    }
    if (isLogicalOr(p)) {
      return p.or.length > 0;
    }

    return Boolean(p);
  });

  return {
    or: preds
  };
}

// NOTE: Doesn't do anything. check
export function mergeFilters(
  predicates: Filter[],
  logical: 'and' | 'or' = 'or'
): Filter {
  return logical === 'and'
    ? createLogicalAndPredicate(predicates)
    : createLogicalOrPredicate(predicates);
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

export function getCombinationFiltersFromSelectionGroups(
  selectionGroups: SelectionInteractionGroups
) {
  const currentSelectionGroup = selectionGroups.slice(-1).flat();

  const previousSelectionGroups = selectionGroups.slice(
    0,
    selectionGroups.length - 1
  );

  const currentSelectionFilterInPredicate = createLogicalOrPredicate(
    getFiltersFromSelections(currentSelectionGroup)
  );

  const currentSelectionFilterOutPredicate = invertFilter(
    currentSelectionFilterInPredicate
  );

  const previousSelectionFilterOutPredicate = previousSelectionGroups.map(sg =>
    invertFilter(createLogicalOrPredicate(getFiltersFromSelections(sg)))
  );

  return {
    currentSelectionFilterOutPredicate,
    previousSelectionFilterOutPredicate,
    currentSelectionFilterInPredicate
  };
}
