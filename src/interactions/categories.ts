export type Option = {
  name: string;
  description?: string;
  default?: boolean;
};

export type Options = Record<string, Option>;

export type Category = {
  name: string;
  description?: string;
  options: Options;
};

export type Categories = Record<string, Category>;
