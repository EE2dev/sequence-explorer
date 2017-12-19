# Sequence explorer
![Image of css styled sankey chart](https://github.com/EE2dev/sequence-explorer/blob/master/sankeySeq.png)
### 1. Overview
Adapting the [sankey diagram](https://bost.ocks.org/mike/sankey/) for sequential data. Click stream analysis or customer journey analysis are just two of many applications for exploring the development of events over some sequence (e.g. points in time such as days, months or years).
Sequence explorer implements the following [d3.js reusable charts pattern](https://github.com/EE2dev/d3-template) to let you customize the chart. The core library [d3-sankeySeq.js](https://github.com/EE2dev/d3-sankeySeq) can also be used separately.

d3-sankeySeq.js adapts the sankey layout for sequential data, sequence-explorer.js is a wrapper on top of sankeySeq with the following features:
- [x] data is read from a csv or a JSON file. Since the visualization is motivated by the [Markov assumption](https://en.wikipedia.org/wiki/Markov_property), the data can be provided in an efficient format just referencing the successors in a sequence and their connection value. See section about [data formatting](#3-data-formatting).
- [x] can be used with just a browser and no web server. In the latter case, data has to be embedded in the html file. 
- [x] sankeySeq places the nodes on a fixed grid. Each state of the sequence (e.g. point in time) has a fixed x position. And each event has a fixed y position.
- [x] supports small multiples
- [x] supports vertical paths
- [x] additional quantitative features can be visualized within the nodes
- [x] links and nodes can be css styled individually for presentations
- [x] supports transition to various proportions
- [x] flowing particles for selected paths. This idea is based on [the following bl.ock](https://bl.ocks.org/emeeks/21f99959d48dd0d0c746) of [@emeeks](https://github.com/emeeks).

For additional features see section [API for sequence explorer](#5-api-for-sequence-explorer).

Here is a link to a video explaining how to use sequence explorer with your own data and [here](http://www.ankerst.de/Mihael/proj/mfc/) is a web site introducing sequence explorer.

### 2. Examples
[The main example is here](http://bl.ocks.org/ee2dev/91abcc611b66aaed6403bca1d48aedbf).

Complete list of examples:

  * [single chart](http://bl.ocks.org/EE2dev/52b57438d4e017eefac1765e5727459a)
  * [single chart - JSON version](http://bl.ocks.org/EE2dev/6b68884490d70aa0092b351e33741d96)
  * [hightlight a path](http://bl.ocks.org/ee2dev/325fdb28bfcba4369ff364c7e5224c35)
  * [hightlight a vertical path](http://bl.ocks.org/EE2dev/b9a20ef36c2a3caf5d7b0374a2d677a7)
  * [small multiples](http://bl.ocks.org/EE2dev/0e709563a63ddfd5c7152e3441593093)
  * [main example](http://bl.ocks.org/EE2dev/91abcc611b66aaed6403bca1d48aedbf)
  * [main example - JSON version](http://bl.ocks.org/EE2dev/5d9aaf31c72caf16d632253629235372)
  * [demo without web server](http://bl.ocks.org/EE2dev/1a4a65727e2e55ac6ae93a9aaef2f312)

### 3. Data formatting

The file must contain each pair of sequential events with the corresponding quantity.
The file must be a comma separated file with the first row containing the attribute names.
The events and points in time must not contain an `_`(*underscore*).

The order of the columns must be:
* first column: the quantity to be displayed 
* second column: the point in time corresponding to the first event 
* third column: the first event
* fourth column: the point in time corresponding to the second event 
* fifth column: the second event (according to the sequence)

Example of valid csv files:
```
frequency,day_from,mood_from,day_to,mood_to
50,Monday,good,Tuesday,good
60,Monday,good,Tuesday,ok
20,Monday,good,Tuesday,bad
30,Tuesday,ok,Wednesday,good
...
```
or
```
_value,state1,cat1,state2,cat2
2650,1,fruit,2,fruit
7860,1,candy,2,fruit
3450,2,meat,3,fruit
5430,2,fish,3,fish
...
```
or
```
quantity,year1,grade_previous,year2,grade_next
10,2010,A,2011,A
6,2010,A,2011,B
20,2011,A,2012,A
14,2011,A,2012,B
...
```

### 3.1 Adding more dimensions
The csv file may contain 1 or 2 more columns, each referring to an additional dimension, such that multiple sankey charts are displayed at once as small multiples. 
The sixth column is used to arrange sankey charts one row for each dimension, whereas the seventh column determines the columns of the small multiples.
Example of a valid csv file:
```
quantity,year1,grade_previous,year2,grade_next,gender,region
10,2010,A,2011,A,boys,city
6,2010,A,2011,B,girls,city
20,2011,A,2012,A,boys,country
14,2011,B,2012,B,girls,country
...
```

### 3.2 Adding additional quantities to the nodes
You might add additional node quantities which have to be stored in a separate file.
This additional file has to be in the same directory as the main csv file and has to be named as the main file with "_nodes" added to the file name.
E.g. original file: `my_sankey_file.csv`--> `my_sankey_file_nodes.csv`

This csv file containing additional node infos has to start off with the first column denoting the point in time and the second column referring to 
the event on the y axis. In the first line, the column names for these two columns have to be ```sourceX``` and `sourceY`. 
If there are one or two more dimensions determined for the small multiples, they would follow after that.
Then there is an arbitrary number of node info columns. For each column the corresponding quantity is set.
 
Example of a valid csv file:
```
sourceX,sourceY,info1,info2
2010,A,5,7
...
```

### 3.3 Adding paths to be highlighted 
You might add paths which can be highlighted with flying particles.
The file structure is similar to the data file plus one extra column called `name`. The only difference is that the first column must be named ```value```, the four columns refering to the path have to be named ```sourceX,sourceY,targetX,targetY```.
This additional file has to be in the same directory as the main csv file and has to be named as the main file with "_paths" added to the file name.
E.g. original file: `my_sankey_file.csv`--> `my_sankey_file_paths.csv`
Please note that paths which are highlighted (meaning particles are flowing) prevents other mouse events from firing. To continue with interactive responses of sequence explorer all paths must be deselected.


Example of a valid csv file:
```
value,sourceX,sourceY,targetX,targetY,gender,region,name
14,2010,A,2011,A,boys,city,myPath
14,2010,A,2011,B,girls,city,myPath
14,2011,A,2012,A,boys,country,myPath
14,2011,B,2012,B,girls,country,myPath
...
```

### 3.4 Loading data from a JSON file 
The data format described above similarly applies to a JSON file.
The file must contain a `data` key refering to an array of data objects. In addition, but optional, the file can
also contain a `dataNodes` key with the additional quantities and a `paths` key for the corresponding paths.

Example of a valid JSON file:
```
{ "data": 
  [
    {
      "value": 167538,
      "sourceX": 1,
      "sourceY": "home",
      "targetX": 2,
      "targetY": "other"
    },
    {
      "value": 1250384,
      "sourceX": 2,
      "sourceY": "product",
      "targetX": 3,
      "targetY": "home"
    },

...
  
    {
      "value": 734055,
      "sourceX": 3,
      "sourceY": "account",
      "targetX": 4,
      "targetY": "product"
    }
  ]
}
```

### 3.5 Data references with no web server
If you are running sequence explorer without a web server, you can put the data (csv format) into the `<pre id="data"></pre>` tag. 
The optional node infos have to be put into the `<pre id="dataNodes"></pre>` tag and the optional path info have to reside within the `<pre id="paths"></pre>` tag.

### 4. Using sequence explorer
If a csv file with data in the correct format exists, the typical call of sequence explorer from your html file is as simple as follows:

```
<!DOCTYPE html>
  <meta charset="utf-8">
  <head>  
    <link rel="stylesheet" type="text/css" href="https://ee2dev.github.io/libs/sankeySeqExplorer.v20.css">
    <script src="https://d3js.org/d3.v4.min.js"></script>
    <script src="https://ee2dev.github.io/libs/sequence-explorer.v20.min.js"></script>
  </head>
  
  <body>
    <script>
      var myChart = sequenceExplorer.chart("myData.csv"); // load data from a csv file

      d3.select("body")
        .append("div")
        .attr("class", "chart")
        .call(myChart); 
    </script>
  </body>
</html>
```

### 5. API for sequence explorer 
function | parameter | explanation
------------ | -------|------
`colOrder()` | *array* | e.g. `sequenceExplorer.chart().colOrder(["20-40", "41-60", "61-80"])` sets the order of the columns (second additional dimension) based on an array. The default order is ascending.
`correspondingEvents()` | *array* | e.g. `sequenceExplorer.chart().correspondingEvents(["home","contact"])` specifies a subset of events which form a unit. An array with a subset of events reduces the percentages shown for a point in time. The default is an array with all events. 
`debugOn()` | *boolean* | e.g. `sequenceExplorer.chart().debug(true)` turns on/off the console.log debugging. The default setting is false.
`eventName()` | *string* | e.g. `sequenceExplorer.chart().eventName("state")` sets the name of the y axis. The default name is "event".
`eventOrder()` | *array* | e.g. `sequenceExplorer.chart().eventOrder(["A", "B", "C"])` sets the order of the events based on an array. The default order is ascending.
`margin()` | *integer* | e.g. `sequenceExplorer.chart().margin(10)` sets the margin in pixels for top, right, bottom, left. The default margin is 5 px.
`nodePadding()` | *integer* | e.g. `sequenceExplorer.chart().nodePadding(10)` sets the y-padding between the events in pixels. The default padding is 8.
`nodeWidth()` | *integer* | e.g. `sequenceExplorer.chart().nodeWidth(20)` sets the width of a node in pixels. The default width is 15.
`particleMin()` | *float* | e.g. `sequenceExplorer.chart().particleMin(0.2)` sets the minimum value for the particle scale which determines the minimum number of particles. The default value is 0.05.
`particleMax()` | *float* | e.g. `sequenceExplorer.chart().particleMax(1)` sets the maximum value for the particle scale which determines the maximum number of particles. The default value is 1.
`particleShape()` | *string* | e.g. `sequenceExplorer.chart().particleShape("person")` sets the shape of the particles. The default shape is "circle".
`particleSize()` | *integer* | e.g. `sequenceExplorer.chart().particleSize(2)` sets the size of the particles. The default size is 1.
`particleSpeed()` | *float* | e.g. `sequenceExplorer.chart().particleSpeed(0.4)` sets the speed of the particles. The default speed is 0.1.
`percentages()` | *array* | e.g. `sequenceExplorer.chart().percentages(["%sameTime","%sameEvent"])` sets the output of the tooltip text to add a %-line for each element. For valid elements, see [Valid percentages for the tooltip text](#7-valid-percentages-for-the-tooltip-text).The first percentage element is used for labeling when transitioning on event. The default is `["%sameTime"]`. 
`rowOrder()` | *array* | e.g. `sequenceExplorer.chart().rowOrder(["USA", "Canada", "Africa"])` sets the order of the rows (first additional dimension) based on an array. The default order is ascending.
`scaleGlobal()` | *boolean* | e.g. `sequenceExplorer.chart().scaleGlobal(false)` turns on/off the global scaling mode. The default setting is true.
`sequenceName()` | *string* | e.g. `sequenceExplorer.chart().sequenceName("year")` sets the name of the x axis. The default name is "sequence".
`sequenceOrder()` | *array* | e.g. `sequenceExplorer.chart().sequenceOrder(["2000", "2001", "2002"])` sets the order of the sequence based on an array. The default order is ascending.
`showNodeLabels()` | *boolean* | e.g. `sequenceExplorer.chart().showNodeLabels(false)` turns on/off the node labels. The default setting is true.
`size()` | *2-dim array* |, e.g. `sequenceExplorer.chart().size([600, 400])` sets the size of the SVG based on an array [width, height]. The default size is [700, 500].
`thousandsSeparator()` | *char* | e.g. `sequenceExplorer.chart().thousandsSeparator(".")` sets the thousands separator. The default separator is ",".
`valueName()` | *string* | e.g. `sequenceExplorer.chart().valueName("frequency")` sets the name of the value. The default name is "value".


-----------------------

### 6. Highlighting nodes and links
Nodes and links can be styled individually with CSS by using the following selectors:
   * selector for nodes: `"rect.nx"` + `<sourceX>` + `".ny"` + `<sourceY>` 
   * selector for links: `"path.lsx"` + `<sourceX>` + `".lsy"` + `<sourceY>` + `".ltx"` + `<targetX>` + `".lty"` + `<targetY>`
   * selector for node infos: `"rect.sankeyNodeInfo"`
   
where `<sourceX>`, `<sourceY>`, `<targetX>`, `<targetY>` have to be replaced by their corresponding instances.
These instances can just contain letters, numbers, and underscore `_` where spaces have been used in the data (which are replaced by `_`). Note that nodes are `<rect>` and links are `<path>` elements.
E.g. if your data looks like this:
```
value,sourceX,sourceY,targetX,targetY
99,2000,A,2001,B
150,2001,B,2002,C
...
```

Then the css selectors would be:
```
  /* drawing one specific link in red */
  path.lsx2000.lsyA.ltx2001.ltyB {
    stroke: red;
  }

  /* drawing all links from A to B in yellow */
  path.lsyA.ltyB {
    stroke: yellow;
  }
  
  /* drawing one specific node in red */
  rect.nx2000.nyA {
    fill: red;
  } 

  /* drawing all B nodes in red */
  rect.nyB {
    fill: red;
  }

  /* drawing node infos in yellow (if '_nodes' file exists) */
  rect.sankeyNodeInfo {
    fill: yellow;
  }  
```
### 7. Valid percentages for the tooltip text
sequenceExplorer.chart().percentages([...])
* always displayed : point in time, event, count
* `"%sameTime"` : point in time, event, count, % of all events at the same point in time (default)
* `"%sameEvent"` : point in time, event, count, % of same event at the whole sequence
* `"%firstEvent"` : point in time, event, count, % of same event at the first point in time
* `"%prevEvent"` : point in time, event, count, % of the same event at the previous point in time

### 8. License
This code is released under the [BSD license](https://github.com/EE2dev/sequence-explorer//blob/master/LICENSE).
