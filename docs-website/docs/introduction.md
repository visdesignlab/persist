# Introduction

Computational notebooks are a modern realization of Donald Knuth’s vision of literate programming. These notebooks allow us to seamlessly mix code, visualizations, figures, and text to analyze data and narrate the analysis. The most popular notebooks are Jupyter notebooks.

Jupyter supports interactive outputs like Vega-Altair charts and Jupyter Widgets in addition to text, static plots, and tables. Code-based analysis in notebooks can be re-run, and the results of one cell can be used in another, making the analysis reproducible and reusable. In contrast, interactive analysis in notebooks presents significant challenges concerning reproducibility and reusability.

## Visualizations in Notebooks are a Dead End!

Until now, there has been a significant disconnect between code and the interactive outputs of notebooks. While code can generate interactive visualizations (such as those created with Vega-Altair), **the results of these interactions cannot be accessed in code**. For instance, if a filter is applied in a visualization, analysts must write additional code to replicate the filter if they want to use it later in their notebook. This limitation vastly reduces the usefulness of interactions within visualizations.

Furthermore, there is a disparity between code and interactions in terms of persistence. Changes to the code are saved and persist across restarts and re-executions. However, interactions are transient and are lost when the notebook is restarted, or the cell is re-executed. This lack of persistence makes visual analysis difficult to reproduce without the added effort of documenting each visual analysis step.




Notice how a selection is lost when a cell is re-executed using standard interactive visualization tools in a notebook.


## Persist makes Interactive Visualizations Useful in Notebooks.

To address these challenges, we have developed Persist, a JupyterLab extension that captures interaction provenance, making interactions persistent and reusable. Persist bridges the gap between code and interactive visualizations, ensuring that all interactions are tracked, recorded, and can be reapplied automatically.
