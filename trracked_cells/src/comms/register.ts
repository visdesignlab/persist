import { NotebookPanel } from '@jupyterlab/notebook';
import { TrrackedCellManager } from '../trracked-cell/cell-manager';

export async function registerComms(panel: NotebookPanel) {
  const ctx = panel.context;

  return Promise.all([ctx.ready, panel.sessionContext.ready]).then(() => {
    panel.sessionContext.connectionStatusChanged.connect(
      (sessionCtx, status) => {
        if (status !== 'connected') return;

        const kernel = sessionCtx.session?.kernel;
        if (!kernel) return;

        console.group('Kernel');
        kernel.registerCommTarget('trracked_cells', (comm, _msg) => {
          comm.onMsg = msg => {
            TrrackedCellManager.processSelection(
              msg.content.data['cellId'] as string,
              msg.content.data['a'] as any
            );
          };
        });

        console.log('comm target registered');

        // kernel.registerCommTarget('trracked_cells', (comm, _msg) => {
        //   testComm = comm;

        //   console.log({ _msg });

        //   console.log(testComm.targetName);

        //   testComm.onMsg = msg => {
        //     const load = msg.content.data;
        //     console.log(load);
        //   };
        // });

        console.groupEnd();
      }
    );
  });
}
