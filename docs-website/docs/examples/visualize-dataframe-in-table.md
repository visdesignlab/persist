---
---
import ReactPlayer from 'react-player'

# Visualize dataframe in an interactive data table

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/visdesignlab/persist/HEAD?labpath=examples%2Fgetting_started_interactive_data_table.ipynb)

You can use the following code snippet to create a Persist-enabled interactive data table.

```python
from vega_datasets import data # Load vega_datasets
import persist_ext as PR # Load Persist Extension

cars_df = data.cars() # Get the cars dataset as Pandas dataframe

PR.PersistTable(cars_df) # Display cars dataset with interactive table
```

## Video Tutorial

<ReactPlayer playing controls url='https://github.com/visdesignlab/persist/assets/14944083/eb174d57-55f3-4ee9-8b5d-189ad8746c26' />
