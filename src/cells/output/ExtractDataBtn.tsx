import { copyIcon } from '@jupyterlab/ui-components';
import { getInteractionsFromRoot } from '../../interactions/helpers';
import { copyStrToClipboard } from '../../utils/copyToClipboard';
import { TrrackableCell } from '../trrackableCell';

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
        onClick={async ev => {
          ev.preventDefault();
          copyStrToClipboard(
            JSON.stringify(getInteractionsFromRoot(props.cell.trrackManager))
          );
        }}
      >
        <copyIcon.react tag="span" />
      </button>
    </div>
  );
}
