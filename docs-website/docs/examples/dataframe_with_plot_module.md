---
---

import ReactPlayer from 'react-player'

# Visualizing dataframe with `plot` module

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/visdesignlab/persist/HEAD?labpath=examples%2Fgetting_started_plots_module.ipynb)

Persist has a plotting module to create an interactive scatterplot or bar chart quickly. This module is a thin wrapper around Vega-Altair.

To create a scatterplot:

```python
from vega_datasets import data # Load vega_datasets
import persist_ext as PR # Load Persist Extension

cars_df = data.cars() # Get the cars dataset as Pandas dataframe

PR.plot.scatterplot(data=cars_df, x="Miles_per_Gallon:Q", y="Weight_in_lbs:Q", color="Origin:N")
```

## Video Tutorial - Scatterplot


<ReactPlayer playing controls url='https://github.com/visdesignlab/persist/assets/14944083/fd75be32-ab2a-425e-8bce-f60c99baebbc
' />

To create a barchart:

```python
from vega_datasets import data # Load vega_datasets
import persist_ext as PR # Load Persist Extension

cars_df = data.cars() # Get the cars dataset as Pandas dataframe

PR.plot.barchart(data=cars_df, x="Cylinders:N", y="count()")
```

## Video Tutorial - BarChart


<ReactPlayer playing controls url='https://github.com/visdesignlab/persist/assets/14944083/16d3be4c-9511-42ed-84ae-d4e65097a5b9' />