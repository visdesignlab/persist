import React, { useCallback } from 'react';
import { Combobox, InputBase, useCombobox } from '@mantine/core';
import { useState } from 'react';

type Props = {
  data: Array<{ value: string; label: string }>;
  onCreate: (text: string) => void;
  getCreateLabel?: (value: string) => string;
  onValueChange: (value: string | undefined) => void;
  value: string | undefined;
  placeholder?: string;
};

export function SelectCreatable({
  data,
  onCreate,
  value,
  onValueChange,
  placeholder,
  getCreateLabel
}: Props) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  });

  const [search, setSearch] = useState(value || '');

  const onCurrentselectedChange = useCallback(
    (newValue: string, create: boolean) => {
      if (create) {
        onCreate(newValue);
      } else {
        setSearch(newValue);
      }
      onValueChange(newValue);
      combobox.closeDropdown();
    },
    [combobox]
  );

  const createLabelMaker = useCallback(
    (text: string) => {
      return getCreateLabel ? getCreateLabel(text) : `+ Create ${text}`;
    },
    [getCreateLabel]
  );

  const exactOptionMatch = data.some(item => item.value === search);
  const filteredOptions = exactOptionMatch
    ? data
    : data.filter(item =>
        item.value.toLowerCase().includes(search.toLowerCase().trim())
      );

  const options = filteredOptions.map(item => (
    <Combobox.Option value={item.value} key={item.value}>
      {item.label}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={val => {
        console.log({ val });
        onCurrentselectedChange(
          val === '$create' ? search : val,
          val === '$create'
        );
      }}
    >
      <Combobox.Target>
        <InputBase
          rightSection={<Combobox.Chevron />}
          value={search}
          onChange={event => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(value || '');
          }}
          placeholder={placeholder ?? 'Search value'}
          rightSectionPointerEvents="none"
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options}
          {!exactOptionMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create">
              {createLabelMaker(search)}
            </Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
