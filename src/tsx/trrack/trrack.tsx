import { createRender, useModel } from "@anywidget/react";
import React from "react";
import { useTrrack } from "./manager";

function Trrack() {
  const { trrack } = useTrrack();
  const model = useModel();

  return (
    <div>
      {trrack.current.id} {model.get("value")} {model.get("trrack")}
    </div>
  );
}

export const render2 = createRender(Trrack);

export function render(test: any) {
  console.log(test);
  return render2(test);
}
