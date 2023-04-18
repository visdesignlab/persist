import { copyIcon } from '@jupyterlab/ui-components';

import { Notification } from '@jupyterlab/apputils';
import React from 'react';
import { DF_NAME } from '../../trrack';
import { TrrackableCell } from '../trrackableCell';

type Props = {
  cell: TrrackableCell;
  id: string;
};

export function ExtractDataBtn(props: Props) {
  return (
    <div
      onClick={ev => ev.stopPropagation()} // Prevent triggering the click on trrack
      style={{
        zIndex: 100,
        display: 'flex',
        flexDirection: 'row'
      }}
    >
      <button
        className="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button"
        type="button"
        onClick={async ev => {
          ev.preventDefault();
          const dfName =
            props.cell.trrackManager.trrack.metadata.latestOfType<string>(
              DF_NAME,
              props.id
            )?.val || '';
          if (dfName.length === 0) return;

          await navigator.clipboard.writeText(
            `IDE.DataFrameStorage.get("${dfName}")`
          );

          Notification.emit(`Copied code for df: ${dfName}`, 'success', {
            autoClose: 500
          });
        }}
      >
        <copyIcon.react tag="span" />
      </button>
      {/* <button
        className="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button"
        type="button"
        onClick={ev => {
          ev.preventDefault();
          setIsLoaded(true);
          extract(props.cell);
        }}
      >
        <addIcon.react tag="span" />
      </button> */}
    </div>
  );
}
