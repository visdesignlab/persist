import { copyIcon } from '@jupyterlab/ui-components';
import React from 'react';
import { TrrackableCell } from '../trrackableCell';
import { extractDfAndCopyName } from './extract_helpers';

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
          extractDfAndCopyName(props.cell, props.id);
        }}
      >
        <copyIcon.react tag="span" />
      </button>
    </div>
  );
}
