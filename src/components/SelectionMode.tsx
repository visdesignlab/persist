import { SegmentedControl } from '@mantine/core';
import { useToggle } from '@mantine/hooks';

export function SelectionMode() {
  const [selectionType, setSelectionMode] = useToggle([
    'none',
    'point',
    'interval'
  ]);

  return (
    <SegmentedControl
      data={[
        { value: 'none', label: 'None' },
        { value: 'interval', label: 'Interval' },
        { value: 'point', label: 'Point' }
      ]}
      value={selectionType}
      onChange={setSelectionMode}
    />
  );
}
