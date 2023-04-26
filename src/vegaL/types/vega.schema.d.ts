import { Value } from 'vl4/build/src/channeldef';
import { VgValueRef as V } from 'vl4/build/src/vega.schema';

declare module 'vega.schema' {
  export interface VgValueRef extends V {
    value?: Value<any>;
  }
}
