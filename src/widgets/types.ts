export type DataType =
  | 'Int64'
  | 'Float64'
  | 'boolean'
  | 'datetime64[ns]'
  | 'timedelta64[ns]'
  | 'category'
  | 'string'
  | 'object';

export type DataColumn = {
  name: string;
  type: DataType;
  isVisible: boolean;
};
export type DataPoint = { K: string } & Record<string, string>;

export type Data = Array<DataPoint>;

export function isNumeric(type: DataType) {
  return ['Int64', 'Float64'].includes(type);
}
