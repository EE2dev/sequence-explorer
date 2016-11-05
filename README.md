# Sequence explorer
### 1. Overview
Adapting the [sankey diagram](https://bost.ocks.org/mike/sankey/) for sequential data. There are many applications for exploring the development of categories over some sequence (e.g. time points such as days, months or years).
Sequence explorer implements the following [d3.js reusable charts pattern](https://github.com/EE2dev/d3-template) to let you customize the chart. The core library [sankeySeq.js](docs/README.md) can also be used separately.

SankeySeq.js adapts the sankey layout for sequential data. SankeySeqExplorer.js is a wrapper on top of sankeySeq with the following features:
* data is read from a csv file. See section about [data formatting](#3-data-formatting).
* can be used with just a browser and no web server. In that case, data has to be embedded in the html file. 
* sankeySeq places the nodes on a fixed grid. The state of the sequence (e.g. point in time) has a fixed x position. And a certain category has a fixed y position.
* supports small multiples
* addition quantitative features can be visualized within the nodes

For additional features see section [API for sequence explorer](#4-api-for-sequence-explorer).

<!--
[Here](https://youtu.be/B8a2O6L31_w) is a link to a video explaining how to use item explorer with your own data and [here](http://www.ankerst.de/Mihael/proj/mbc/) is a web site introducing item explorer.
--->

### Data

- [demography](http://www.bib-demografie.de/DE/ZahlenundFakten/02/Tabellen/t_02_01_bevstand_d_1960_2060.html;jsessionid=F996B8093DC563B8B2A5F791C5683174.2_cid292?nn=3074120)
-----------------------
### 2. Examples
The main example is here.

### 3. Data formatting

The file must contain each pair of sequential categories with the corresponding quantity.
The file must be a comma separated file with the first row containing the attribute names.

The order of the columns must be:
* first column: the quantity to be displayed 
* second column: the first category 
* third column: the state of the sequence corresponding to the first category
* fourth column: the second category (according to the sequence) 
* fifth column: the state of the sequence corresponding to the second category

Example of valid csv files:
```
frequency,mood_from,day_from,mood_to,day_to
50,good,Monday,good,Tuesday
60,good,Monday,ok,Tuesday
20,good,Monday,bad,Tuesday
30,ok,Tuesday,good,Wednesday
...
```
or
```
_value,cat1,state1,cat2,state2
2650,fruit,1,fruit,2
7860,candy,1,fruit,2
3450,meat,2,fruit,3
5430,fish,2,fish,3
...
```
or
```
quantity,grade_previous,year1,grade_next,year2
10,A,2010,A,2011
6,A,2010,B,2011
20,A,2011,A,2012
14,B,2011,B,2012
...
```

### 3.1 Adding more categories
The csv file may contain 1 or 2 more columns, each referring to an additional category, such that multiple sankey charts are displayed at once as small multiples. 
The sixth column is used to arrange sankey chart one row for each category, whereas the seventh column deteremines the columns of the small multiples.
Example of valid csv files:
```
quantity,grade_previous,year1,grade_next,year2,gender,region
10,A,2010,A,2011,boys,city
6,A,2010,B,2011,girls,city
20,A,2011,A,2012,boys,country
14,B,2011,B,2012,girls,country
...
```

### 3.2 Adding additional categories with node info
You might add additional categories with their respective quantity in a separate file.
This additional file has to be in the same directory as the main csv file and has to be named as the main file with "_nodes" added to the file name.
E.g. original file: `my_sankey_file.csv`--> `my_sankey_file_nodes.csv`

This csv file containing additional node infos has to start off with the first column denoting the sequence state and the second column referring to 
the category on the y axis. At this point, just ```sourceX``` and `sourceY` are allowed as column names. 
If there are one or two more categories determined for the small multiples, they would follow after that.
Then there is an arbitrary number of node info columns. For each column the corresponding quantity is set.
 
Example of valid csv files:
```
sourceX,sourceY,first_product,info1,Info3-test
2000,1,A,10,10
2000,2,A,220,60
2001,0,A,40,200
2000,1,C,80,60
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
`nodeWidth()` | *integer* | e.g. `reUsableChart.nodeWidth(20)` sets the width of a node in pixels. The default width is 15.
`nodePadding()` | *integer* | e.g. `reUsableChart.nodePadding(10)` sets the y-padding between the categories in pixels. The default padding is 8.

-----------------------

