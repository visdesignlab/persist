import { IDEGlobal } from '../../utils';
import { Executor } from './exec';

export async function computeDataFrame(dfName: string, dfString: string) {
  if (!dfName) {
    console.log('Computing', dfName);
    return Promise.resolve();
  }

  return await IDEGlobal.executor.execute(
    Executor.withJson(
      Executor.withPandas(
        Executor.withIDE(
          `dfName="${dfName}"\nIDE.DataFrameStorage.add(dfName, pd.read_json('${dfString}'))\ndfName`
        )
      )
    )
  );
}
