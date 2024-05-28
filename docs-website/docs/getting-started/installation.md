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




## Contributing

Persist uses [hatch](https://hatch.pypa.io/latest/) to manage the development, build and publish workflows. You can install `hatch` using `pipx`, `pip` or Homebrew (on MacOS or Unix).

##### **pipx**

Install `hatch` globally in isolated environment. We recommend this way.

```bash
pipx install hatch
```

##### **pip**

Install hatch in the current Python environment.

_**WARNING**_: This may change the system Python installation.

```bash
pip install hatch
```

##### **Homebrew**

```bash
pip install hatch
```

Jupyter extensions use a custom version of `yarn` package manager called `jlpm`. When any relevant command is run, `hatch` should automatically install and setup up `jlpm`.
After installing `hatch` with your preferred method follow instructions below for workflow you want. We prefix all commands with `hatch run` to ensure they are run in proper environments.

### Development

Run the `setup` script from `package.json`:

```bash
hatch run jlpm setup
```

When setup is completed, open three terminal windows and run the follow per terminal.

#### Widgets

Setup vite dev server to build the widgets

```bash
hatch run watch_widgets
```

#### Extension

Start dev server to watch and build the extension

```bash
hatch run watch_extension
```

#### Lab

Run JupyterLab server with `minimize` flag set to `false`, which gives better stack traces aqnd debugging experience.

```bash
hatch run run_lab
```

### Build

To build the extension as a standalone Python package, run:

```bash
hatch run build_extension
```

### Publish

To publish the extension, first we create a proper version. We can run any of the following

```bash
hatch version patch # x.x.1
hatch version minor # x.1.x
hatch version major # 1.x.x
```

You can also append release candidate label:

```bash
hatch version rc
```

Finally you can directly specify the exact version:

```bash
hatch version "1.3.0"
```

Once the proper version is set, build the extension using the `build` workflow.

When the build is successful, you can publish the extension if you have proper authorization:

```bash
hatch publish
```

### Acknowledgements

The widget architecture of Persist is created using [anywidget](https://github.com/manzt/anywidget) projects.

The interactive visualizations used by Persist are based on the excellent, [Vega-Lite](https://github.com/vega/vega-lite) and [Vega-Altair](https://github.com/altair-viz/altair) projects. Specifically the implementation of [JupyterChart](https://github.com/altair-viz/altair/blob/main/altair/jupyter/jupyter_chart.py) class in Vega-Altair was of great help in understanding how Vega-Altair chart can be turned into a widget. We gratefully acknowledge funding from the National Science Foundation (IIS 1751238 and CNS 213756).

