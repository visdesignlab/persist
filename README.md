# Persist
## Persistent and Reusable Interactions in Computational Notebooks

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/visdesignlab/persist/main?urlpath=lab)

This repository contains source code for Persist ([PyPi](https://pypi.org/project/persist_ext/)) extension.

Persist is a JupyterLab extension to enable persistent interactive outputs in JupyterLab notebooks. Check out the introductory video below.

https://github.com/visdesignlab/persist/assets/14944083/c6a9347b-7c93-4d0d-9e60-e10707578327

[Watch on Youtube with CC](https://www.youtube.com/watch?v=DXHXPvRHN9I)

### Publication
Persist is developed as part of a [publication](https://osf.io/preprints/osf/9x8eq) and is currently under review.

![Teaser image from the pre-print. The figure describes the workflow showing high level working of Persist technique.](public/imgs/teaser.png)


#### Abstract
> Computational notebooks, such as Jupyter, support rich data visualization. However, even when visualizations in notebooks  are interactive, they still are a dead end: Interactive data manipulations, such as selections, applying labels, filters, categorizations, or fixes to column or cell values, could be efficiently apply in interactive visual components, but interactive components typically cannot manipulate Python data structures. Furthermore, actions performed in interactive plots are volatile, i.e., they are lost as soon as the cell is re-run, prohibiting reusability and reproducibility. To remedy this, we introduce Persist, a family of techniques to capture and apply interaction provenance to enable persistence of interactions. When interactions manipulate data, we make the transformed data available in dataframes that can be accessed in downstream code cells. We implement our approach as a JupyterLab extension that supports tracking interactions in Vega-Altair plots and in a data table view. Persist can re-execute the interaction provenance when a notebook or a cell is re-executed enabling reproducibility and re-use.  
> 
> We evaluated Persist in a user study targeting data manipulations with 11 participants skilled in Python and Pandas, comparing it to traditional code-based approaches. Participants were consistently faster with Persist, were able to correctly complete more tasks, and expressed a strong preference for Persist. 


### Persist and Vega-Altair charts

Persist works with Vega-Altair charts directly for the most part. Vega-Altair and Vega-Lite offer multiple ways to write a specification. However Persist has certain requirements that need to be fulfilled.

- The selection parameters in the chart should be named. Vega-Altair's default behavior is to generate a name of selection parameter with auto-incremented numeric suffix. The value of the generated selection parameter keeps incrementing on subsequent re-executions of the cell. Persist relies on consistent names to replay the interactions, and passing the name parameter fixes allows Persist to work reliably.

- The point selections should have at least the fields attribute specified. Vega-Altair supports selections without fields by using the auto-generated indices to define selections. The indices are generated with the default order of rows in the source dataset. Using the indices directly for selection can cause Persist to operate on incorrect rows if the source dataset order changes.

- Dealing with datetime in Pandas is challenging. To standardize the way datetime conversion takes place within VegaLite and within Pandas when using Vega-Altair, the TimeUnit transforms and encodings must be specified in UTC. e.g `month(Date)` should be `utcmonth(Date)`.



## Requirements
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
If the Jupyter server is running, you might have to reload the browser page and restart the kernel.

## Uninstall

To remove the extension, execute:

```bash
pip uninstall persist_ext
```

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

The interactive visualizations used by Persist are based on the excellent, [Vega-Lite](https://github.com/vega/vega-lite) and [Vega-Altair](https://github.com/altair-viz/altair) projects. Specifially the implementation of [JupyterChart](https://github.com/altair-viz/altair/blob/main/altair/jupyter/jupyter_chart.py) class in Vega-Altair was of great help in understanding how Vega-Altair chart can be turned into a widget.

<!-- ### Citing
```bibtex
@article{gadhave_2023,
 title={Persist: Persistent and Reusable Interactions in Computational Notebooks},
 url={osf.io/9x8eq},
 DOI={10.31219/osf.io/9x8eq},
 publisher={OSF Preprints},
 author={Gadhave, Kiran, Cutler, Zach and Lex, Alexander},
 year={2023},
 month={Dec}
}
``` -->