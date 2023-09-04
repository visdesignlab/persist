import { createRender } from "@anywidget/react";
import { useHookstate } from "@hookstate/core";
import { Button } from "@mantine/core";
import * as React from "react";
import styles from "./styles.module.css";

function App() {
  const counter = useHookstate(0);

  return (
    <Button
      className={styles.counterButton}
      onClick={() => counter.set((c) => c + 1)}
    >
      Counter is: {counter.get()}
    </Button>
  );
}

export const render = createRender(App);
