export {};
// import { Field } from '../interactions/types';
// import { Range } from '../utils';
// import {
//   BaseTupleField,
//   NamedSelectionIntervalSignals,
//   SelectionIntervalSignal
// } from './types';

// function getBaseSignal<Dims extends number, Type extends BaseTupleField>(
//   signals: NamedSelectionIntervalSignals<Dims, Type>,
//   base: string
// ) {
//   return signals[base] as {
//     [key: string]: Range<Dims>;
//   };
// }

// function getSignalTuple<Dims extends number, Type extends BaseTupleField>(
//   signals: NamedSelectionIntervalSignals<Dims, Type>,
//   base: string
// ) {
//   return signals[`${base}_tuple`] as any;
// }

// function getSignalX<Dims extends number>(
//   signals: SelectionIntervalSignal<Dims>,
//   base: string
// ) {
//   return signals[`${base}_x`] as Range<Dims>;
// }

// function getSignalY<Dims extends number>(
//   signals: SelectionIntervalSignal<Dims>,
//   base: string
// ) {
//   return signals[`${base}_y`] as Range<Dims>;
// }

// export namespace IntervalSignal {
//   export function wrapIntervalSignal<Dims extends number>(
//     signals: SelectionIntervalSignal<Dims>,
//     base: string
//   ) {
//     const tuple = getSignalTuple(signals, base) as any;

//     const xTuple = tuple?.fields.find(
//       (a: any) => a.type === 'R' && a.channel === 'x'
//     );
//     const yTuple = tuple?.fields.find(
//       (a: any) => a.type === 'R' && a.channel === 'y'
//     );

//     const x = xTuple?.field;
//     const y = yTuple?.field;

//     return !x && !y
//       ? {
//           get pts() {
//             return null;
//             // return eTuple && eTuple.type === 'E'
//             //   ? {
//             //       field: eTuple.field,
//             //       values: eTuple.values
//             //     }
//             //   : null;
//           }
//         }
//       : {
//           get x(): Field<Dims> | null {
//             return x
//               ? {
//                   field: x,
//                   pixel: getSignalX(signals, base),
//                   domain: getBaseSignal(signals, base)[x]
//                 }
//               : null;
//           },
//           get y(): Field<Dims> | null {
//             return y
//               ? {
//                   field: y,
//                   pixel: getSignalY(signals, base),
//                   domain: getBaseSignal(signals, base)[y]
//                 }
//               : null;
//           }
//         };
//   }
// }
