import { NotebookPanel } from '@jupyterlab/notebook';

export const PY_STR_TYPE = 'str';
export const PY_PD_TYPE = 'pandas.core.frame.DataFrame';

export class Executor {
  constructor(private _nb: NotebookPanel) {}

  get sessionCtx() {
    return this._nb.sessionContext;
  }

  async exec(code: string) {
    return this.sessionCtx.session?.kernel?.requestExecute({ code });
  }

  async filterCurrentSelections() {
    console.log('Filtering');
  }
}

export namespace Private {
  export function withIDE(code: string) {
    return `import interactivede.IDE as IDE\n${code}`;
  }

  export function withPandas(code: string) {
    return `import pandas as pd\n${code}`;
  }
}
