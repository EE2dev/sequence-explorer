# Sequence explorer
![Image of css styled sankey chart](https://github.com/EE2dev/sequence-explorer/blob/master/sankeySeq.png)
### 1. Overview
Adapting the [sankey diagram](https://bost.ocks.org/mike/sankey/) for sequential data. Click stream analysis or customer journey analysis are just two of many applications for exploring the development of categories over some sequence (e.g. time points such as days, months or years).
Sequence explorer implements the following [d3.js reusable charts pattern](https://github.com/EE2dev/d3-template) to let you customize the chart. The core library [d3-sankeySeq.js](https://github.com/EE2dev/d3-sankeySeq) can also be used separately.

d3-sankeySeq.js adapts the sankey layout for sequential data. sequence-explorer.js is a wrapper on top of sankeySeq with the following features:
* data is read from a csv file. Since the visualization is motivated by the [Markov assumption](https://en.wikipedia.org/wiki/Markov_property), the data can be provided in an efficient format just referencing the successors in a sequence and their connection value. See section about [data formatting](#3-data-formatting).
* can be used with just a browser and no web server. In that case, data has to be embedded in the html file. 
* sankeySeq places the nodes on a fixed grid. The state of the sequence (e.g. point in time) has a fixed x position. And a certain category has a fixed y position.
* supports small multiples
* additional quantitative features can be visualized within the nodes
* links and nodes can be css styled individually for presentations

For additional features see section [API for sequence explorer](#4-api-for-sequence-explorer).

### 2. Examples
[The main example is here](http://bl.ocks.org/ee2dev/91abcc611b66aaed6403bca1d48aedbf).

Complete list of examples:

  * [single chart](http://bl.ocks.org/EE2dev/52b57438d4e017eefac1765e5727459a)
  * [hightlight a path](http://bl.ocks.org/ee2dev/325fdb28bfcba4369ff364c7e5224c35)
  * [demo2](http://bl.ocks.org/EE2dev/0e709563a63ddfd5c7152e3441593093)
  * [demo without web server](http://bl.ocks.org/EE2dev/1a4a65727e2e55ac6ae93a9aaef2f312)

### 3. Data formatting

The file must contain each pair of sequential categories with the corresponding quantity.
The file must be a comma separated file with the first row containing the attribute names.
The categories and sequence states must not contain an `_`(*underscore*).

The order of the columns must be:
* first column: the quantity to be displayed 
* second column: the state of the sequence corresponding to the first category 
* third column: the first category
* fourth column: the state of the sequence corresponding to the second category 
* fifth column: the second category (according to the sequence)

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

This csv file containing additional node infos has to start off with the first column denoting the sequence state and the second column referring to 
the category on the y axis. In the first line, the column names for these two columns have to be ```sourceX``` and `sourceY`. 
If there are one or two more categories determined for the small multiples, they would follow after that.
Then there is an arbitrary number of node info columns. For each column the corresponding quantity is set.
 
Example of a valid csv file:
```
sourceX,sourceY,info1,info2
2010,A,5,7
...
```

### 3.3 Data references with no web server
If you are running sequence explorer without a web server, you can put the data (csv format) into the `<pre id="data"></pre>` tag. 
The optional node infos can be put into the `<pre id="dataNodes"></pre>` tag. 

### 4. Using sequence explorer
If a csv file with data in the correct format exists, the typical call of item explorer from your html file looks as follows:

```
    ...
    // include the following files:
    <link rel="stylesheet" type="text/css" href="http://www.ankerst.de/lib/sankeySeqExplorer_10.css">
    <script src="https://d3js.org/d3.v4.js"></script>
    <script src="http://www.ankerst.de/lib/sequence-explorer.min.js"></script>
    ...
    // setup a chart with a csv file and add the visualization to a DOM element
    // no parameter when data is embedded in <pre id="data"> tag, otherwise sequenceExplorer.chart(file);
    // var myChart = sequenceExplorer.chart();
    var myChart = sequenceExplorer.chart("myData.csv");
    
    d3.select("body")
      .append("div")
      .attr("class", "chart")
      .call(myChart);
```

### 5. API for sequence explorer 
function | parameter | explanation
------------ | -------|------
`categories()` | *array* | e.g. `sequenceExplorer.chart().categories(["A", "B", "C"])` sets the order of the categories based on an array. The default order is ascending.
`categoryName()` | *string* | e.g. `sequenceExplorer.chart().categoryName("state")` sets the name of the y axis. The default name is "category".
`colOrder()` | *array* | e.g. `sequenceExplorer.chart().colOrder(["20-40", "41-60", "61-80"])` sets the order of the columns (second additional dimension) based on an array. The default order is ascending.
`debugOn()` | *boolean* | e.g. `sequenceExplorer.chart().debug(true)` turns on/off the console.log debugging. The default setting is false.
`margin()` | *integer* | e.g. `sequenceExplorer.chart().margin(10)` sets the margin in pixels for top, right, bottom, left. The default margin is 5 px.
`nodePadding()` | *integer* | e.g. `sequenceExplorer.chart().nodePadding(10)` sets the y-padding between the categories in pixels. The default padding is 8.
`nodeWidth()` | *integer* | e.g. `sequenceExplorer.chart().nodeWidth(20)` sets the width of a node in pixels. The default width is 15.
`rowOrder()` | *array* | e.g. `sequenceExplorer.chart().rowOrder(["USA", "Canada", "Africa"])` sets the order of the rows (first additional dimension) based on an array. The default order is ascending.
`scaleGlobal()` | *boolean* | e.g. `sequenceExplorer.chart().scaleGlobal(false)` turns on/off the global scaling mode. The default setting is true.
`sequence()` | *array* | e.g. `sequenceExplorer.chart().sequence(["2000", "2001", "2002"])` sets the order of the sequence based on an array. The default order is ascending.
`sequenceName()` | *string* | e.g. `sequenceExplorer.chart().sequenceName("year")` sets the name of the x axis. The default name is "sequence".
`showNodeLabels()` | *boolean* | e.g. `sequenceExplorer.chart().showNodeLabels(false)` turns on/off the node labels. The default setting is true.
`size()` | *2-dim array* |, e.g. `sequenceExplorer.chart().size([600, 400])` sets the size of the SVG based on an array [width, height]. The default size is [700, 500].
`thousandsSeparator()` | *char* | e.g. `sequenceExplorer.chart().thousandsSeparator(".")` sets the thousands separator. The default separator is ",".
`tooltipFormat()` | *array* | e.g. `sequenceExplorer.chart().tooltipFormat(["%event"])` sets the output of the tooltip text to add a line with % of all categories at the same event. 
`valueName()` | *string* | e.g. `sequenceExplorer.chart().valueName("frequency")` sets the name of the value. The default name is "value".


-----------------------

### 6. Highlighting nodes and links
Nodes and links can be styled individually with CSS by using the following selectors:
   * selector for nodes: `"rect.nx"` + `<sourceX>` + `".ny"` + `<sourceY>` 
   * selector for links: `"path.lsx"` + `<sourceX>` + `".lsy"` + `<sourceY>` + `".ltx"` + `<targetX>` + `".lty"` + `<targetY>`
   * selector for node infos: `"rect.sankeyNodeInfo"`
   
where `<sourceX>`, `<sourceY>`, `<targetX>`, `<targetY>` have to be replaced by their corresponding instances.
These instances can just contain letters,numbers and spaces, where the spaces will be replaced by `"_"`. Note that nodes are `<rect>` and links are `<path>` elements.
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
### 7. Format of the tooltip text
sequenceExplorer.chart().tooltipFormat([...])
* default : event, category, count
* `"%event"` : event, category, count, % of all categories at the same event
* `"%firstCategory"` : event, category, count, % of same category at the first event
* `"%prevCategory"` : event, category, count, % of the same category at the previous event

### 8. License
This code is released under the [BSD license](https://github.com/EE2dev/sequence-explorer//blob/master/LICENSE).
