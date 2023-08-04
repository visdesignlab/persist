const VALID_PYTHON_VAR = /^[A-Za-z_][A-Za-z0-9_]*/;

export function isValidPythonVar(str: string): boolean {
  return VALID_PYTHON_VAR.test(str);
}
