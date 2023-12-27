# Persist
## Persistent and Reusable Interactions in Computational Notebooks

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/visdesignlab/persist/main?urlpath=lab)

Persist `(persist_ext)` is a JupyterLab extension to enable persistent interactive outputs in JupyterLab notebooks. 

<iframe width="560" height="315" src="https://www.youtube.com/embed/DXHXPvRHN9I?si=wSndL-jjFuia8ZoV" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### Publication

<figure>
<img src="public/imgs/teaser.png" alt="Teaser image from the pre-print. The figure describes the workflow showing high level working of Persist technique."/>
<figcaption>
Persist captures interaction provenance for visualizations embedded in computational notebooks and applies them to data structures. The code cell in (a) shows that an analyst loaded a table, created a Persist-enabled scatterplot, and printed the head of the dataframe (b). The second output of the cell is an interactive scatterplot instrumented with Persist (c). Persist tracks the interaction provenance and supplements operations, such as filters, labeling, or categorization. Using interactions available on the Persist toolbar (d) an analyst has filtered three points, assigned a new category to two points and currently has three points selected. (e) A provenance graph where the analysts interactions are tracked. (f) Persist manipulates the underlying dataframe by translating the interaction provenance to dataframe operations. The updated dataframe, <strong>df5</strong>, is then fed back into scatterplot, but is also available in subsequent code cells (g). (h) The manipulated dataframe contains a new categorical column (Engine) and a new Boolean column capturing selections. 3 items were removed (cf.\ 27 vs 30 rows in (b)).
</figcaption>
</figure>


Persist is developed as part of a [publication](https://osf.io/preprints/osf/9x8eq) and is currently under review.

#### Abstract
> Computational notebooks, such as Jupyter, support rich data visualization. However, even when visualizations in notebooks  are interactive, they still are a dead end: Interactive data manipulations, such as selections, applying labels, filters, categorizations, or fixes to column or cell values, could be efficiently apply in interactive visual components, but interactive components typically cannot manipulate Python data structures. Furthermore, actions performed in interactive plots are volatile, i.e., they are lost as soon as the cell is re-run, prohibiting reusability and reproducibility. To remedy this, we introduce Persist, a family of techniques to capture and apply interaction provenance to enable persistence of interactions. When interactions manipulate data, we make the transformed data available in dataframes that can be accessed in downstream code cells. We implement our approach as a JupyterLab extension that supports tracking interactions in Vega-Altair plots and in a data table view. Persist can re-execute the interaction provenance when a notebook or a cell is re-executed enabling reproducibility and re-use.  
> 
> We evaluated Persist in a user study targeting data manipulations with 11 participants skilled in Python and Pandas, comparing it to traditional code-based approaches. Participants were consistently faster with Persist, were able to correctly complete more tasks, and expressed a strong preference for Persist. 


<!-- % \begin{itemize}
%     \item The selection parameters in the chart should be named. Vega-Altair's default behavior is to generate a name of selection parameter with auto-incremented numeric suffix. The value of the generated selection parameter keeps incrementing on subsequent re-executions of the cell. Persist relies on consistent names to replay the interactions, and passing the name parameter fixes allows Persist to work reliably.
%     \item The point selections should have at least the fields attribute specified. Vega-Altair supports selections without fields by using the auto-generated indices to define selections. The indices are generated with the default order of rows in the source dataset. Using the indices directly for selection can cause Persist to operate on incorrect rows if the source dataset order changes.
%     \item Dealing with datetime in Pandas is challenging. To standardize the way datetime conversion takes place within VegaLite and within Pandas when using Vega-Altair, the TimeUnit transforms and encodings must be specified in UTC. e.g $month(Date)$ should be $utcmonth(Date)$.
% \end{itemize} -->


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

### Development install
