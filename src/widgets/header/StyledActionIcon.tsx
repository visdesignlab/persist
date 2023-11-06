import React, { ForwardedRef, PropsWithChildren, forwardRef } from 'react';
import {
  ActionIcon,
  ActionIconProps,
  Tooltip,
  TooltipProps
} from '@mantine/core';

declare module 'react' {
  // eslint-disable-next-line
  function forwardRef<T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
  ): (props: P & React.RefAttributes<T>) => React.ReactElement | null;
}

export const HeaderActionIcon = forwardRef(
  (props: ActionIconProps & any, ref: ForwardedRef<HTMLButtonElement>) => {
    const { children, ...rest } = props;

    const actionButton = (
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

    return actionButton;
  }
);

type Props = {
  tooltipProps?: Omit<TooltipProps, 'children'>;
};

export const PersistActionIconButton = forwardRef(
  (
    {
      children,
      tooltipProps,
      ...rest
    }: PropsWithChildren<Props> & ActionIconProps,
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    const actionIcon = (
      <ActionIcon ref={ref} size="xs" {...rest}>
        {children}
      </ActionIcon>
    );

    if (tooltipProps) {
      return <Tooltip {...tooltipProps}>{actionIcon}</Tooltip>;
    }

    return actionIcon;
  }
);
