import { NodeId, isRootNode } from '@trrack/core';
import { TrrackManager } from '../trrack';

export function getInteractionsFromRoot(
  manager: TrrackManager,
  till: NodeId = manager.current
) {
  const ids: NodeId[] = [];
  const nodes = manager.trrack.graph.backend.nodes;

  let node = nodes[till];

  while (!isRootNode(node)) {
    ids.push(node.id);
    node = nodes[node.parent];
  }

  ids.push(manager.trrack.root.id);
  ids.reverse();

  return ids.map(i => nodes[i]).map(node => manager.trrack.getState(node));
}

// // TODO: Once finishd refactor filters to use it
// /**
//  * Projections:
//  *  Interval:
//  *   Encodings -> Limit to specified encoding channel like x, y or color
//  *  Point
//  *   Encodings -> Limit to specified encoding channel like x, y or color
//  *   Fields -> If field specified is "Origin", select all points that match "Origin" of clicked point(s)
//  */
// export function getFiltersFromRangeSelection(
//   spec: VL4.Spec,
//   selection: any
// ): Array<FilterValue> {
//   if (!spec) throw new Error();

//   const ranges: FilterValue[] = [];

//   const { init, encodings = [] } = selection;

//   if (!init) return ranges;

//   const params: any = {};

//   if (!params) return ranges;

//   // Add if no encodings are specified or if x is specified
//   if ('x' in params && (encodings.length === 0 || encodings.includes('x')))
//     ranges.push({
//       field: params.x?.field,
//       range: params.x?.range
//     });

//   // Add if no encodings are specified or if y is specified
//   if ('y' in params && (encodings.length === 0 || encodings.includes('y')))
//     ranges.push({
//       field: params.y.field,
//       range: params.y.range
//     });

//   return ranges;
// }

// type InteractionCharMap = { [k in Interaction['type']]: string };

// const interactionCharMap: InteractionCharMap = {
//   selection_point: 's', // selection
//   selection_interval: 's',
//   label: 't', // terminal
//   filter: 't',
//   aggregate: 't',
//   create: 'c' // create
// };

// const _inter: Interaction[] = [
//   {
//     id: uuid(),
//     type: 'create'
//   },
//   {
//     id: uuid(),
//     type: 'selection_interval',
//     name: 'a',
//     params: null
//   },
//   {
//     id: uuid(),
//     type: 'selection_interval',
//     name: 'a',
//     params: null
//   },
//   {
//     id: uuid(),
//     type: 'label'
//   },
//   {
//     id: uuid(),
//     type: 'selection_interval',
//     name: 'a',
//     params: null
//   },
//   {
//     id: uuid(),
//     type: 'selection_point',
//     name: 'a'
//   },
//   {
//     id: uuid(),
//     type: 'aggregate'
//   },
//   {
//     id: uuid(),
//     type: 'selection_interval',
//     name: 'a',
//     params: null
//   },
//   {
//     id: uuid(),
//     type: 'aggregate'
//   }
// ];

// export function processInteractions(manager: TrrackManager) {
//   let interactions = getInteractionsFromRoot(manager);
//   interactions = _inter;

//   const sequence = interactions.map(i => interactionCharMap[i.type]).join('');

//   console.log(interactions);

//   console.log(sequence);
//   console.log(getInteractionGroups(sequence));
// }

// export function getInteractionGroups(str: string) {
//   const regex = /s+[^s]/gm;

//   const matches = str.matchAll(regex);

//   console.log(Array.from(matches));
// }
