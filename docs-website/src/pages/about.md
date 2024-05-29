---
title: About
description: About reVISit team
hide_table_of_contents: false
---
import Admonition from '@theme/Admonition';
import ReactPlayer from 'react-player';
import ContextSensitiveImage from '../components/ContextSensitiveImage.tsx'


# Persist: Persistent and Reusable Interactions in Computational Notebooks

## What Is Persist?

Computational notebooks like JupyterLab have become indispensable tools, enabling seamless integration of code, visualizations, and text. However, modern notebooks limit the usefulness of interactions in visualizations in two significant ways. First, the results of interactions in visualizations cannot be accessed in code. For example, a filter applied in a visualization cannot be applied directly to the data in the notebook. Second, unlike code changes, interactions with data visualizations are transient – they are lost when the cell is re-executed or the kernel is restarted. In this post, we introduce our solution to these issues: Persist, a JupyterLab extension that enables persistent interaction and data manipulation with visualizations in notebooks.

<ReactPlayer controls url='https://github.com/visdesignlab/persist/assets/14944083/c6a9347b-7c93-4d0d-9e60-e10707578327
' width='100%'/>

<br/>


## Paper

For a more in depth description of the project, check out the [2024 EuroVis Submission](https://vdl.sci.utah.edu/publications/2024_eurovis_persist/). 

<Admonition type="info" icon="" title="">
    <div style={{margin:"-10px 0px -20px 10px"}}>
        Kiran Gadhave, Zach Cutler, Alexander Lex <br/>
        <a style={{fontWeight:"bold"}}href="https://sci.utah.edu/~vdl/papers/2024_eurovis_persist.pdf">Persist: Persistent and Reusable Interactions in Computational Notebooks</a><br/>
        Computer Graphics Forum (EuroVis), to appear, 43(3): doi:10.31219/osf.io/9x8eq, 2024.
    </div>
</Admonition>

## Project Team

Persist is a project developed at the [University of Utah](https://vdl.sci.utah.edu).

[Alexander Lex](https://vdl.sci.utah.edu/team/lex/), PI, University of Utah  
[Kiran Gadhave](https://www.kirangadhave.me/), PhD Student, University of Utah  
[Zach Cutler](https://vdl.sci.utah.edu/team/zcutler/), PhD Student, University of Utah  

## Contact

If you have any questions, please [e-mail us](mailto:alex@sci.utah.edu). 

## Acknowledgements

The widget architecture of Persist is created using [anywidget](https://github.com/manzt/anywidget) projects.

The interactive visualizations used by Persist are based on the excellent, [Vega-Lite](https://github.com/vega/vega-lite) and [Vega-Altair](https://github.com/altair-viz/altair) projects. Specifically the implementation of [JupyterChart](https://github.com/altair-viz/altair/blob/main/altair/jupyter/jupyter_chart.py) class in Vega-Altair was of great help in understanding how Vega-Altair chart can be turned into a widget. We gratefully acknowledge funding from the National Science Foundation (IIS 1751238 and CNS 213756).

<ContextSensitiveImage src="img/logos/nsf.png" style={{height:'200px'}}/>