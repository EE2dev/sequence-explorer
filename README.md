# sequence explorer
Adapting the sankey diagram for sequential data. There are many applications for exploring the development of categories over some sequence (e.g. time points such as days, months or years).
Sequence explorer implements the following [d3.js reusable charts pattern](https://github.com/EE2dev/d3-template) to let you customize the chart.

<!--
[Here](https://youtu.be/B8a2O6L31_w) is a link to a video explaining how to use item explorer with your own data and [here](http://www.ankerst.de/Mihael/proj/mbc/) is a web site introducing item explorer.
--->

### To do

- change initialization of single/ multiples
- change tag(pre) into divs, also if tag(pre)
- change conditions dimCol == "" /dimRow into allGraphs.cols/ .rows === 1
- tooltip
- add names for x and y axes for tooltip
- multiplesColumns(boolean)
- css styling
- node text an/aus
- testing browsers (change display:table)
- remove test layout in css
- licence

### Data

- [demography](http://www.bib-demografie.de/DE/ZahlenundFakten/02/Tabellen/t_02_01_bevstand_d_1960_2060.html;jsessionid=F996B8093DC563B8B2A5F791C5683174.2_cid292?nn=3074120)
-----------------------

### 1. Data formatting

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

####Pivot by additional categories

### 3. Visualization options
function | parameter | explanation
------------ | -------|------
`debugOn()` | *boolean* | e.g. `sankeySeq.debug(true)` turns on/off the console.log debugging. The default setting is false.
`size()` | *2-dim array* |, e.g. `sankeySeq.size([600, 400])` explicitely sets size of the SVG based on an array [width, height]. The default size is [700, 500].
`margin()` | *integer* | e.g. `sankeySeq.margin(10)` explicitely sets margin in pixels for top, right, bottom, left. The default margin is 0 px.
`sequence()` | *array* | e.g. `sankeySeq.sequence(["2000", "2001", "2002"])` explicitely sets the order of the sequence based on an array. The default order is ascending.
`categories()` | *array* | e.g. `sankeySeq.categories(["A", "B", "C"])` explicitely sets the order of the categories based on an array. The default order is ascending.
`sequenceName()` | *string* | e.g. `sankeySeq.sequenceName("year")` explicitely sets the name of the x axis. The default name is "sequence".
`categoryName()` | *string* | e.g. `sankeySeq.categoryName("state")` explicitely sets the name of the y axis. The default name is "category".
`valueName()` | *string* | e.g. `sankeySeq.valueName("frequency")` explicitely sets the name of the value. The default name is "value".
`nodeWidth()` | *integer* | e.g. `sankeySeq.nodeWidth(20)` explicitely sets the width of a node in pixels. The default width is 15.
`nodePadding()` | *integer* | e.g. `sankeySeq.nodePadding(10)` explicitely sets the y-padding between the categories in pixels. The default padding is 8.
