---
---
import ReactPlayer from 'react-player'


# Interactive Vega-Altair charts

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

## Video Tutorial

<ReactPlayer playing controls url='https://github.com/visdesignlab/persist/assets/14944083/fadd5e6a-d6b6-4513-a94c-43b54ad4d047
' />