import { JSONPath } from 'jsonpath-plus';

export type JSONPathResult<T = any> = Array<{
  path: string;
  value: T;
  parent: any[];
  pointer: string;
  hasArrExpr: boolean;
  parentProperty: string;
}>;

export function getJSONPath<T>(json: any, path: string): JSONPathResult<T> {
  return JSONPath({
    json,
    path,
    resultType: 'all'
  });
}
