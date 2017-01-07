# Sequence explorer
### 1. Overview
Adapting the [sankey diagram](https://bost.ocks.org/mike/sankey/) for sequential data. Click stream analysis or customer journey analysis are just two of many applications for exploring the development of categories over some sequence (e.g. time points such as days, months or years).
Sequence explorer implements the following [d3.js reusable charts pattern](https://github.com/EE2dev/d3-template) to let you customize the chart. The core library [sankeySeq.js](docs/README.md) can also be used separately.

SankeySeq.js adapts the sankey layout for sequential data. SankeySeqExplorer.js is a wrapper on top of sankeySeq with the following features:
* data is read from a csv file. Since the visualization is motivated by the [markov assumption](https://en.wikipedia.org/wiki/Markov_property), the data can be provided in an efficient format just referencing the successors in a sequence and their connection value. See section about [data formatting](#3-data-formatting).
* can be used with just a browser and no web server. In that case, data has to be embedded in the html file. 
* sankeySeq places the nodes on a fixed grid. The state of the sequence (e.g. point in time) has a fixed x position. And a certain category has a fixed y position.
* supports small multiples
* additional quantitative features can be visualized within the nodes
* links and nodes can be css styled individually for presentations

For additional features see section [API for sequence explorer](#4-api-for-sequence-explorer).

<!--
[Here](https://youtu.be/B8a2O6L31_w) is a link to a video explaining how to use item explorer with your own data and [here](http://www.ankerst.de/Mihael/proj/mbc/) is a web site introducing item explorer.
--->

### 2. Examples
The main example is here.

### 3. Data formatting

The file must contain each pair of sequential categories with the corresponding quantity.
The file must be a comma separated file with the first row containing the attribute names.

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
The sixth column is used to arrange sankey chart one row for each category, whereas the seventh column determines the columns of the small multiples.
Example of valid csv files:
```
quantity,year1,grade_previous,year2,grade_next,gender,region
10,2010,A,2011,A,boys,city
6,2010,A,2011,B,girls,city
20,2011,A,2012,A,boys,country
14,2011,B,2012,B,girls,country
...
```

### 3.2 Adding additional quantities to the nodes
You might add additional node quantities from a separate file.
This additional file has to be in the same directory as the main csv file and has to be named as the main file with "_nodes" added to the file name.
E.g. original file: `my_sankey_file.csv`--> `my_sankey_file_nodes.csv`

This csv file containing additional node infos has to start off with the first column denoting the sequence state and the second column referring to 
the category on the y axis. In the first line, the column names for these two columns have to be ```sourceX``` and `sourceY`. 
If there are one or two more categories determined for the small multiples, they would follow after that.
Then there is an arbitrary number of node info columns. For each column the corresponding quantity is set.
 
Example of valid csv files:
```
sourceX,sourceY,info1,info2
2010,A,5,7
...
```

### 4. API for sequence explorer 
function | parameter | explanation
------------ | -------|------
`debugOn()` | *boolean* | e.g. `reUsableChart.debug(true)` turns on/off the console.log debugging. The default setting is false.
`size()` | *2-dim array* |, e.g. `reUsableChart.size([600, 400])`y sets size of the SVG based on an array [width, height]. The default size is [700, 500].
`margin()` | *integer* | e.g. `reUsableChart.margin(10)` sets margin in pixels for top, right, bottom, left. The default margin is 5 px.
`sequence()` | *array* | e.g. `reUsableChart.sequence(["2000", "2001", "2002"])` sets the order of the sequence based on an array. The default order is ascending.
`categories()` | *array* | e.g. `reUsableChart.categories(["A", "B", "C"])` sets the order of the categories based on an array. The default order is ascending.
`sequenceName()` | *string* | e.g. `reUsableChart.sequenceName("year")` sets the name of the x axis. The default name is "sequence".
`categoryName()` | *string* | e.g. `reUsableChart.categoryName("state")` sets the name of the y axis. The default name is "category".
`valueName()` | *string* | e.g. `reUsableChart.valueName("frequency")` sets the name of the value. The default name is "value".
`thousandsSeparator()` | *char* | e.g. `reUsableChart.thousandsSeparator(".")` sets the thousands separator. The default separator is ",".
`nodeWidth()` | *integer* | e.g. `reUsableChart.nodeWidth(20)` sets the width of a node in pixels. The default width is 15.
`nodePadding()` | *integer* | e.g. `reUsableChart.nodePadding(10)` sets the y-padding between the categories in pixels. The default padding is 8.

-----------------------

### 5. Highlighting nodes and links
Nodes and links can be styled individually with CSS by using the following selectors:
   * selector for nodes: `"rect.nx"` + `<sourceX>` + `".ny"` + `<sourceY>` 
   * selector for links: `"path.lsx"` + `<sourceX>` + `".lsy"` + `<sourceY>` + `".ltx"` + `<targetX>` + `".lty"` + `<targetY>`
   
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
  path.lsy1.lty2 {
    stroke: yellow;
  }
  
  /* drawing one specific node in red */
  rect.nx2000.nyA {
    fill: red;
  } 

  /* drawing all B nodes  in red */
  rect.nyB {
    fill: red;
  }
```

### 6. License
This code is released under the [BSD license](https://github.com/EE2dev/sequence-explorer//blob/master/LICENSE).
