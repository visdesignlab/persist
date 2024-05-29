---
---
import ReactPlayer from 'react-player'


# Composite Vega-Altair Charts

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

## Video Tutorial

<ReactPlayer playing controls url='https://github.com/visdesignlab/persist/assets/14944083/2808e722-f908-4cf9-8f66-5f2d90c5460d
' />