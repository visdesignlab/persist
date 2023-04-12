import { Range } from '../vega/types';

export type SelectionType = 'interval' | 'single' | 'multi';

export type VegaSpec = {
  [key: string]: unknown;
  $schema: string;
  selection: {
    [key: string]: {
      type: SelectionType;
      empty: 'none' | 'all';
    };
  };
};

export type SelectionIntervalInit = {
  x: Range<2>;
  y: Range<2>;
};

export type UrlData = {
  data: {
    url: string;
  };
};
