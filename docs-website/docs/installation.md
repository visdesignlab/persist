---
sidebar_position: 1
---

# Installation

To install the Jupyterlab extension, be sure to verify that you have the following packages installed:


```markdown
- JupyterLab >= 4.0.0 or Jupyter Notebook >= 7.0.0
- pandas >= 0.25
- altair >= 5
- ipywidgets
- anywidget
```

## Install

To install the extension, execute:

```bash
pip install persist_ext
```

If the Jupyter server was already running, you might have to reload the browser page and restart the kernel.

## Uninstall

To remove the extension, execute:

```bash
pip uninstall persist_ext
```

## Usage

Persist supports two types of interactive outputs — a custom data table and [Vega-Altair](https://altair-viz.github.io/) (>=5.0.0, see [requirements](https://github.com/visdesignlab/persist#requirements) and [caveats](https://github.com/visdesignlab/persist#caveats-on-using-vega-altair-and-persist)) charts. The following examples will walk you through creating each one.
The examples are also available as notebooks in the `examples` folder of the repository. Each section will link to the corresponding notebook as well as a binder link for the notebook.

Persist currently works with pandas dataframes, so load/convert the data to pandas dataframe before using.

