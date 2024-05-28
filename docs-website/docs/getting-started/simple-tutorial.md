---
sidebar_position: 2
---

# Using Persist

Below are some simple examples to get you started with Persist. You can find additional examples in the supplemental material of the [Persist paper](https://github.com/visdesignlab/persist_examples).

## Visualize dataframe in an interactive data table

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/visdesignlab/persist/HEAD?labpath=examples%2Fgetting_started_interactive_data_table.ipynb)

You can use the following code snippet to create a Persist-enabled interactive data table.

```python
from vega_datasets import data # Load vega_datasets
import persist_ext as PR # Load Persist Extension

cars_df = data.cars() # Get the cars dataset as Pandas dataframe

PR.PersistTable(cars_df) # Display cars dataset with interactive table
```

https://github.com/visdesignlab/persist/assets/14944083/eb174d57-55f3-4ee9-8b5d-189ad8746c26

## Visualzing dataframe with `plot` module

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/visdesignlab/persist/HEAD?labpath=examples%2Fgetting_started_plots_module.ipynb)

Persist has a plotting module to create an interactive scatterplot or bar chart quickly. This module is a thin wrapper around Vega-Altair.

To create a scatterplot:

```python
from vega_datasets import data # Load vega_datasets
import persist_ext as PR # Load Persist Extension

cars_df = data.cars() # Get the cars dataset as Pandas dataframe

PR.plot.scatterplot(data=cars_df, x="Miles_per_Gallon:Q", y="Weight_in_lbs:Q", color="Origin:N")
```

https://github.com/visdesignlab/persist/assets/14944083/fd75be32-ab2a-425e-8bce-f60c99baebbc

To create a barchart:

```python
from vega_datasets import data # Load vega_datasets
import persist_ext as PR # Load Persist Extension

cars_df = data.cars() # Get the cars dataset as Pandas dataframe

PR.plot.barchart(data=cars_df, x="Cylinders:N", y="count()")
```

https://github.com/visdesignlab/persist/assets/14944083/16d3be4c-9511-42ed-84ae-d4e65097a5b9

## Interactive Vega-Altair charts

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/visdesignlab/persist/HEAD?labpath=examples%2Fgetting_started_vega_altair.ipynb)

You can also use Vega-Altair charts directly by passing the chart object to the `PersistChart` function.

```python
from vega_datasets import data # Load vega_datasets
import altair as alt
import persist_ext as PR # Load Persist Extension

cars_df = data.cars() # Get the cars dataset as Pandas dataframe

brush = alt.selection_interval(name="selection")

chart = alt.Chart().mark_point().encode(
    x="Weight_in_lbs:Q",
    y="Miles_per_Gallon:Q",
    color=alt.condition(brush, "Origin:N", alt.value("lightgray"))
).add_params(
    brush
)

PR.PersistChart(chart, data=cars_df)
```

https://github.com/visdesignlab/persist/assets/14944083/fadd5e6a-d6b6-4513-a94c-43b54ad4d047

## Composite Vega-Altair Charts

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/visdesignlab/persist/HEAD?labpath=examples%2Fgetting_started_composite_vega_altair_charts.ipynb)

Persist also supports composite Vega-Altair charts.

```python
from vega_datasets import data # Load vega_datasets
import altair as alt
import persist_ext as PR # Load Persist Extension

movies_df = data.movies() # Get the cars dataset as Pandas dataframe

pts = alt.selection_point(name="selection", fields=["Major_Genre"])

rect = alt.Chart().mark_rect().encode(
    alt.X('IMDB_Rating:Q').bin(),
    alt.Y('Rotten_Tomatoes_Rating:Q').bin(),
    alt.Color('count()').scale(scheme='greenblue').title('Total Records')
)

circ = rect.mark_point().encode(
    alt.ColorValue('grey'),
    alt.Size('count()').title('Records in Selection')
).transform_filter(
    pts
)

bar = alt.Chart(width=550, height=200).mark_bar().encode(
    x='Major_Genre:N',
    y='count()',
    color=alt.condition(pts, alt.ColorValue("steelblue"), alt.ColorValue("grey"))
).add_params(pts)

chart = alt.vconcat(
    rect + circ,
    bar
).resolve_legend(
    color="independent",
    size="independent",
)

PR.PersistChart(chart, data=movies_df)
```

https://github.com/visdesignlab/persist/assets/14944083/2808e722-f908-4cf9-8f66-5f2d90c5460d

## Caveats on using Vega-Altair and Persist

Persist works with Vega-Altair charts directly for the most part. Vega-Altair and Vega-Lite offer multiple ways to write a specification. However, Persist has certain requirements that need to be fulfilled.

- The selection parameters in the chart should be named. Vega-Altair's default behavior is to generate a name of the selection parameter with an auto-incremented numeric suffix. The value of the generated selection parameter keeps incrementing on subsequent re-executions of the cell. Persist relies on consistent names to replay the interactions, and passing the name parameter fixes allows Persist to work reliably.

- The point selections should have at least the field attribute specified. Vega-Altair supports selections without fields by using auto-generated indices to define them. The indices are generated in the source dataset in the default order of rows. Using the indices directly for selection can cause Persist to operate on incorrect rows if the source dataset order changes.

- Dealing with datetime in Pandas is challenging. To standardize the way datetime conversion takes place within VegaLite and Pandas when using Vega-Altair, the TimeUnit transforms, and encodings must be specified in UTC. e.g `month(Date)` should be `utcmonth(Date)`.
