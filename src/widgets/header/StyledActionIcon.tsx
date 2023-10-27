import React, { ForwardedRef, forwardRef } from 'react';
import { ActionIcon, ActionIconProps, ElementProps } from '@mantine/core';

declare module 'react' {
  // eslint-disable-next-line
  function forwardRef<T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
  ): (props: P & React.RefAttributes<T>) => React.ReactElement | null;
}

export const HeaderActionIcon = forwardRef(
  (
    props: ActionIconProps & ElementProps<'button', keyof ActionIconProps>,
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    const { children, ...rest } = props;

    return (
      <ActionIcon
        ref={ref}
        color="grey"
        {...rest}
        style={{
          backgroundColor: rest.disabled ? 'transparent' : 'default'
        }}
        variant="subtle"
        radius="xs"
      >
        {children}
      </ActionIcon>
    );
  }
);
