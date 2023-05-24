import { Notification } from '@jupyterlab/apputils';
import { copyIcon } from '@jupyterlab/ui-components';
import React from 'react';
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

          const dfName = 'df_' + props.id.substr(0, 5).replace('-', '_');

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
