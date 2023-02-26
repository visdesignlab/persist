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
