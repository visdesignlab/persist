---
sidebar_position: 2
---
import ReactPlayer from 'react-player'
import ContextSensitiveImage from '../../src/components/ContextSensitiveImage.tsx'

# Quickstart Tutorial


## Analysis with Persist

It’s easiest to see how it works by following an analysis. We’ll look at [avalanches in the Utah mountains](https://utahavalanchecenter.org/). You can follow along using this [binder instance.](https://mybinder.org/v2/gh/visdesignlab/persist/HEAD?labpath=examples%2Fblog.ipynb) _Binder instance might take a few minutes to start the first time._ You can also [download the notebook](https://raw.githubusercontent.com/visdesignlab/persist/main/examples/blog.ipynb) and run the notebook in a local JupyterLab instance. Follow the instructions [here](https://vdl.sci.utah.edu/persist/docs/installation) to set up local JupyterLab with Persist extension.

_The notebook uses VegaAltair to create interactive visualizations and assumes some familiarity with VegaAltair, VegaLite, and the declarative approach to creating visualizations. You can refer to their [getting started](https://altair-viz.github.io/getting_started/overview.html) for a quick introduction. You won’t have to write any VegaAltair code to follow the blog._

<ContextSensitiveImage src='img/tutorial_images/step_2.png' className='docs-image'/>


After loading the data, we examine the data in an interactive data table using the following code.

<ContextSensitiveImage src='img/tutorial_images/step_3.png' className='docs-image'/>

### Working with Columns

We notice the dataset contains artifacts like leading semicolons in some column names. We can double-click the column header to edit the name and delete the semicolons from all four columns.
<ContextSensitiveImage src='img/tutorial_images/step_4.png' className='docs-image'/>

All our operations are tracked in a provenance graph on the right side. If we make a mistake, we can click on the previous step and fix it.

Next, we will delete the coordinates and comments columns since we will not perform any location or text-based analysis.

<ContextSensitiveImage src='img/tutorial_images/step_5.png' className='docs-image'/>


### Changing a Column’s Data Type
We can hover over the column headers to see the data type. The `Depth_inches` column has the data type `string` instead of `float`. We want the `Depth_inches` to be a `float` column so we can plot it later. We also see that row 7 has a trailing inches symbol, `”`, which is the cause of the incorrect data type.

We can use the search box on the top left of the table to find all instances of the trailing symbol. We can double-click the cell to edit it and remove the symbol. Using the menu in the column header, we will change the column's data type to float.

### Extracting a Dataframe
We can click the “insert dataframe” button in the dataframe manager at the bottom of the table to insert a cell with a pandas dataframe called `av_ut1`. This dataframe has the changes we made in the table applied: the column names are corrected, two columns are removed, and the datatype of `Depth_inches` is numerical.

<ContextSensitiveImage src='img/tutorial_images/step_6.png' className='docs-image'/>

#### Equivalent pandas code
For reference, here is the equivalent pandas code for making these changes to the dataframe: 

<ContextSensitiveImage src='img/tutorial_images/step_7.png' className='docs-image'/>




### Filtering Data in a Visualization
Next, we take a look at how to interactively manipulate data in visualizations. 

Using the following code, we will create an interactive scatterplot of `Elevation_feet` vs. `Depth_inches` using the plot module (basically a shorthand for common vega-altair plots) and our new dataframe. 

<ContextSensitiveImage src='img/tutorial_images/step_8.png' className='docs-image'/>

If we look at this plot carefully, we can see that it shows avalanches occurring at elevations outside the possible range for Utah (Utah’s lowest point is at about 2,200 feet; its highest is at 13,528 feet), indicating that these entries are unreliable. We can select these points using a brush and remove them from the dataset.

We can again access the resulting dataframe from the dataframe manager.

#### Equivalent pandas code
Again, here’s the equivalent pandas code:

<ContextSensitiveImage src='img/tutorial_images/step_9.png' className='docs-image'/>

### Removing old data
We will not look at the count of records aggregated by the year. We will use the following code to create the plot. 

We see that before 2010, we don’t have many records. We will remove the records for those years from our analysis. We can again interactively select the data we want to remove and filter it out.

Equivalent pandas code

### Creating a New Category in a Custom Vega-Altair Chart
Next, we'll add a new categorical classification to our dataset: types of avalanche activity vary over the snow season, so we classify the season into three phases: Start, Middle, End. Using the following code, we will create a Vega-Altair bar chart with data aggregated by month and make it persistent:

<ContextSensitiveImage src='img/tutorial_images/step_11.png' className='docs-image'/>

We will first create a new category, `Av_Season`, and add the three options using the new category popup. Next, we interactively select the months and assign them the appropriate phase.

<ContextSensitiveImage src='img/tutorial_images/step_12.png' className='docs-image'/>
Notice that the season is now part of our dataset, and we could facet our dataset based on the season for further analysis. 


#### Equivalent pandas code

<ContextSensitiveImage src='img/tutorial_images/step_13.png' className='docs-image'/>

## The Persist Technique

Persist leverages the concept of interaction provenance as a shared abstraction between code and interactions within a notebook. Interaction provenance records all interactions leading to a particular point in the analysis. Each interaction is captured in the output of a code cell and documented in a provenance graph. This graph tracks the interactive analysis in real-time, supports navigation through the history, and allows branching off to explore alternative analysis paths.

Interactions recorded in the provenance graph are translated into data operations, updating the underlying dataframe. This updated dataframe is then used to refresh the output and is available as a new variable for further analysis.


## Caveats on using Vega-Altair and Persist

Persist works with Vega-Altair charts directly for the most part. Vega-Altair and Vega-Lite offer multiple ways to write a specification. However, Persist has certain requirements that need to be fulfilled.

- The selection parameters in the chart should be named. Vega-Altair's default behavior is to generate a name of the selection parameter with an auto-incremented numeric suffix. The value of the generated selection parameter keeps incrementing on subsequent re-executions of the cell. Persist relies on consistent names to replay the interactions, and passing the name parameter fixes allows Persist to work reliably.

- The point selections should have at least the field attribute specified. Vega-Altair supports selections without fields by using auto-generated indices to define them. The indices are generated in the source dataset in the default order of rows. Using the indices directly for selection can cause Persist to operate on incorrect rows if the source dataset order changes.

- Dealing with datetime in Pandas is challenging. To standardize the way datetime conversion takes place within VegaLite and Pandas when using Vega-Altair, the TimeUnit transforms, and encodings must be specified in UTC. e.g `month(Date)` should be `utcmonth(Date)`.
