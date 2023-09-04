import { useModelState } from "@anywidget/react";
import { Registry, initializeTrrack } from "@trrack/core";
import { useMemo } from "react";

type Interaction = any;

type TrrackState = {
  interaction: Interaction;
};

export type Events = "create";

const defaultTrrackState: TrrackState = {
  interaction: "hello",
};

type LabelLike = string | (() => string);

export function getLabelFromLabelLike(label: LabelLike): string {
  return typeof label === "function" ? label() : label;
}

export function createTrrackInstance(
  graphToLoad: string,
  setter: (g: string) => void,
) {
  const registry = Registry.create();

  const addInteractionAction = registry.register(
    "interaction",
    (_, interaction: Interaction) => {
      return interaction;
    },
  );

  const trrack = initializeTrrack<TrrackState, Events>({
    registry,
    initialState: defaultTrrackState,
  });

  if (graphToLoad.length > 0) {
    trrack.import(graphToLoad);
  } else {
    setter(trrack.export());
  }

  const unsubscribe = trrack.currentChange(() => {
    setter(trrack.export());
  });

  function apply(label: string, interaction: Interaction) {
    return trrack.apply(label, addInteractionAction(interaction));
  }

  return { trrack, apply, unsubscribe };
}

export function useTrrack() {
  const [trrackGraph, setTrrackGraph] = useModelState<string>("trrack");

  const { trrack, apply } = useMemo(() => {
    return createTrrackInstance(trrackGraph || "", setTrrackGraph);
  }, [trrackGraph]);

  return { trrack, apply };
}
