import { isArray } from 'lodash';
import { isDateTime } from 'vega-lite/build/src/datetime';
import {
  LogicalAnd,
  LogicalComposition,
  LogicalNot,
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
  SelectionParameter
} from 'vega-lite/build/src/selection';
import { FilterTransform, Transform } from 'vega-lite/build/src/transform';
import { objectToKeyValuePairs } from '../../utils/objectToKeyValuePairs';
import { isSelectionInterval } from './selection';
import { isPrimitiveValue } from './spec';

export function getCompositeOutFilterFromSelections(
  selections: SelectionParameter[]
): FilterTransform {
  const filters: LogicalComposition<Predicate>[] = selections
    .map(getOutFiltersFromSelection)
    .flat()
    .map(k => k.filter);

  return createFilterTransform(
    createLogicalNotPredicate(createLogicalOrPredicate(filters))
  );
}

export function getOutFiltersFromSelection(
  selection: SelectionParameter
): FilterTransform[] {
  const value = selection.value;

  const filters: FilterTransform[] = [];

  if (isPrimitiveValue(value) || isDateTime(value)) {
    //
  } else if (isArray(value)) {
    const predicates = value.map(createFEPredicate).map(createFilterTransform);

    filters.push(...predicates);
  } else if (typeof value === 'object') {
    let predicates = createFRPredicate(value).map(createFilterTransform);

    console.log(selection.select);

    predicates = isSelectionInterval(selection)
      ? [
          createFilterTransform(
            createLogicalAndPredicate(predicates.map(p => p.filter))
          )
        ]
      : predicates;

    // if error in brush then wrap in and

    filters.push(...predicates);
  }

  return filters;
}

export function invertFilter({ filter }: FilterTransform): FilterTransform {
  return createFilterTransform(
    isLogicalNot(filter)
      ? filter.not
      : {
          not: filter
        }
  );
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

export function createFRPredicate(
  selection: SelectionInitIntervalMapping
): FieldRangePredicate[] {
  const selections = objectToKeyValuePairs(selection);

  return selections.map(({ key, value }) => ({
    field: key,
    range: value as any
  }));
}

function createFEPredicate(
  selection: SelectionInitMapping
): FieldEqualPredicate {
  const { key, value } = objectToKeyValuePairs(selection)[0];

  return {
    field: key,
    equal: value as any
  };
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

function createLogicalOrPredicate(
  predicates: Array<LogicalComposition<Predicate>>
): LogicalOr<Predicate> {
  return {
    or: predicates
  };
}

function createLogicalNotPredicate(
  predicate: LogicalComposition<Predicate>
): LogicalNot<Predicate> {
  return {
    not: predicate
  };
}

export function mergeFilters(
  transform: Transform[],
  _logical: 'and' | 'or' = 'or'
): Transform[] {
  return transform;
  // const filters = transform.filter(isFilter);
  // const nonFilters = transform.filter(f => !isFilter(f));

  // const predicates = filters.map(f => f.filter);

  // const filter = createFilterTransform(
  //   logical === 'and'
  //     ? createLogicalAndPredicate(predicates)
  //     : createLogicalOrPredicate(predicates)
  // );

  // return [filter, ...nonFilters];
}
