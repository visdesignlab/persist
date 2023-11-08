const VALID_PYTHON_VAR = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function isValidPythonVar(str: string): boolean {
  return VALID_PYTHON_VAR.test(str);
}
