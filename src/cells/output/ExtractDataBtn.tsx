import { copyIcon } from '@jupyterlab/ui-components';
import { TrrackableCell } from '../trrackableCell';
import { extractDfAndCopyName } from './extract_helpers';

type Props = {
  cell: TrrackableCell;
  id: string;
};

export function ExtractDataBtn(props: Props) {
  const dfName = props.cell.trrackManager.getVariableNameFromNodeMetadata(
    props.id
  );

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
        disabled={!dfName}
        onClick={async ev => {
          ev.preventDefault();
          if (dfName) {
            extractDfAndCopyName(props.cell, props.id, dfName);
          }
        }}
      >
        <copyIcon.react tag="span" />
      </button>
    </div>
  );
}
