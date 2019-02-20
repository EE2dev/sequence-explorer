import * as d3 from "d3";
import { default as sankeySeq } from "./sankeySeq";
import { positionTooltipNode, getTranslation, formatNumber, orderDimension, getColRowOfSingle } from "./helper";
import { initialize_whp_and_axes, initializeFrame } from "./initialize";
import { transitionToSingle, transitionToMultiples}  from "./transition";
import { transitionXaxis, transitionXaxisBack, transitionYaxis, transitionYaxisBack } from "./transitionAxes";
import { particles} from "./particles";

export default function(_myData) {
  "use strict";
  
  // 0.1 All options not accessible to caller 
  let file; // reference to data (embedded or in file)
  let nodeFile; // optional file with additional node infos
  let pathFile; // optional file with paths
  let nodeInfoKeys; // the key names of the additional node infos
  let nodeInfoNone = "(none)"; // displayed string for no info key
  let nodeInfoKey = nodeInfoNone; // the selected key
  let nodeInfos = {}; // Object containing the three variables above as properties
  let valueName; // the column name of the frequency value
  let scaleGlobal = true; // scale the node height for multiples over all sankeys
  let showNodeLabels = true; // show node labels
  let percentages = ["%sameTime"]; // (default) format of the tooltip text
  let allGraphs; // data structure containing columns of rows of sankey input data;
  let tooltip;
  const SINGLE = 1; // single sankey diagram
  const MULTIPLES = 2; // small multiples diagramm
  const ZOOMX = 3; // transitioned to a zoomed display of fractions on x axis
  const ZOOMY = 4; // transitioned to a zoomed display of fractions on y axis
  let visMode = MULTIPLES;
  let classPaths = d3.map(); // maps the class (e.g."f col-row") of g.sankeyFrame to its paths. for particles
  let pathsArray; // arry of paths for classPaths;
  let props; // properties calculated in initialization function
  let myParticles = particles();

  ///////////////////////////////////////////////////
  // 1.0 add visualization specific variables here //
  ///////////////////////////////////////////////////
  
  // 1.1 All options that should be accessible to caller  
  let debugOn = false,
    nodeWidth = 15,
    nodePadding = 8, 
    size = [700, 500],
    margin = {left: 5, top: 5, right: 5, bottom: 5},
    sequence,
    categories,
    colOrder,
    rowOrder,
    corrCategories = function(){return categories;}, // subset of categories for calculating percentages (tooltip, transitions) 
    sequenceName = "sequence",
    categoryName = "category",
    thousandsSeparator = ",",
    particleMin = 0.05,
    particleMax = 0.5,
    particleSpeed = 0.1,
    particleSize = 1,
    particleShape = "circle",
    particleShapeArray = ["circle", "person"];

  // 1.2 all updatable functions to be called by getter-setter methods  
  // var updateNodeInfo;
  
  ////////////////////////////////////////////////////
  // 2.0 API for external access                    //
  //////////////////////////////////////////////////// 

  // standard API for selection.call(my_reUsableChart)
  function chartAPI(selection) {
    selection.each( function (d) {
      console.log(d);
      console.log("_myData "+ _myData);
      if (typeof d !== "undefined") { // data processing from outside
        createChart(selection, d);
      }
      else { // data processing here
        if (typeof _myData == "object") {
          loadData(_myData, selection);
        } else if (typeof _myData !== "undefined") {
          readData(_myData, selection);
        }
        else {
          readData("<pre>", selection);
        }
      }
    });
  }  
  
  // API - example for getter-setter method
  // 2.1 add getter-setter  methods here
  // categories have been renamed to be events to the outside caller
 
  chartAPI.debugOn = function(_) {
    if (!arguments.length) return debugOn;
    debugOn = _;
    return chartAPI;
  };
  
  chartAPI.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return chartAPI;
  };
  
  chartAPI.margin = function(_) {
    if (!arguments.length) return margin;
    margin.left = _;
    margin.top = _;
    margin.right = _;
    margin.bottom = _;  
    return chartAPI;
  };  

  chartAPI.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return chartAPI;
  };
 
  chartAPI.nodePadding = function(_) { 
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return chartAPI;
  };
  
  chartAPI.sequenceOrder = function(_) {
    if (!arguments.length) return sequence;
    sequence = _;
    return chartAPI;
  };
  
  chartAPI.eventOrder = function(_) {
    if (!arguments.length) return categories;
    categories = _;
    return chartAPI;
  };
  
  chartAPI.sequenceName = function(_) {
    if (!arguments.length) return sequenceName;
    sequenceName = _;
    return chartAPI;
  };
  
  chartAPI.eventName = function(_) {
    if (!arguments.length) return categoryName;
    categoryName = _;
    return chartAPI;
  };  
  
  chartAPI.valueName = function(_) {
    if (!arguments.length) return valueName;
    valueName = _;
    return chartAPI;
  };

  chartAPI.thousandsSeparator = function (_thousandsSeparator) {
    if (!arguments.length) return thousandsSeparator;
    thousandsSeparator = _thousandsSeparator;
    return chartAPI;      
  };  
  
  chartAPI.scaleGlobal = function(_) {
    if (!arguments.length) return scaleGlobal;
    scaleGlobal = _;
    return chartAPI;
  };
  
  chartAPI.showNodeLabels = function(_) {
    if (!arguments.length) return showNodeLabels;
    showNodeLabels = _;
    return chartAPI;
  };

  chartAPI.percentages = function(_) {
    if (!arguments.length) return percentages;
    percentages = _;
    return chartAPI;
  };

  chartAPI.rowOrder = function(_) {
    if (!arguments.length) return rowOrder;
    rowOrder = _;
    return chartAPI;
  };

  chartAPI.colOrder = function(_) {
    if (!arguments.length) return colOrder;
    colOrder = _;
    return chartAPI;
  };

  chartAPI.particleMin = function(_) {
    if (!arguments.length) return particleMin;
    particleMin = _;
    return chartAPI;
  };

  chartAPI.particleMax = function(_) {
    if (!arguments.length) return particleMax;
    particleMax = _;
    return chartAPI;
  }; 

  chartAPI.particleSpeed = function(_) {
    if (!arguments.length) return particleSpeed;
    particleSpeed = _;
    return chartAPI;
  };  
  
  chartAPI.particleSize = function(_) {
    if (!arguments.length) return particleSize;
    particleSize = _;
    return chartAPI;
  };

  chartAPI.particleShape = function(_) {
    if (!arguments.length) return particleShape;
    if (particleShapeArray.indexOf(_) !== -1) {
      particleShape = _;
    }
    return chartAPI;
  }; 

  // returns a function that returns an array of categories 
  // for the transitions and tooltip  
  chartAPI.correspondingEvents = function(_) { 
    if (!arguments.length) return corrCategories();
    corrCategories = function() {return _;};
    return chartAPI;
  };

  ////////////////////////////////////
  // 3.0 add private functions here //
  ////////////////////////////////////
  
  // functions for building the menu
  function displaySankeyMenu(rootSelection) {
    var div1 = rootSelection.append("div").attr("class", "sankeyMenu");
    
    // options menu
    var divOm = div1.append("div").attr("class", "OptionsMenu");
    
    divOm.append("div")
      .attr("class", "titleMenu")
      .append("label")
      .text("options");     
    
    if (!(allGraphs.cols === 1 && allGraphs.rows === 1)) {
      var div2 = divOm.append("span")
        .attr("class", "span1")
        .append("input")
        .attr("class", "nodeScaling")
        .attr("type", "checkbox")
        .on("change", function(d) { updateScaling(rootSelection, d);} );
        
      div2.node().checked = scaleGlobal;
      
      divOm.select("span.span1")
        .append("label")
        .text("global scale"); 
      
      divOm.append("br");
    }
        
    var div3 = divOm.append("span")
      .attr("class", "span2")
      .append("input")
      .attr("class", "labelOnOff")
      .attr("type", "checkbox")
      .on("change", function() { updateNodeLabels(rootSelection);});
      
    div3.node().checked = showNodeLabels;  
      
    div1.select("span.span2")
      .append("label")
      .text("node labels"); 
      
    // node info menu  
    if (typeof nodeFile === "undefined") { return;}
    
    if (debugOn) {
      console.log("nodeInfoKeys: ");
      console.log(nodeInfoKeys);
    }
    var divNim = rootSelection.select("div.sankeyMenu")
        .append("div")
        .attr("class", "NodeInfoMenu");
   
    divNim.append("div")
        .attr("class", "titleMenu")
        .append("label")
        .text("node info");
          
    divNim = divNim.append("form")
        .selectAll("span")
        .data(nodeInfoKeys) 
        .enter()
      .append("span");
      
    divNim.append("input")
      .attr("type", "radio")
      .attr("name", "menu")
      .attr("value", function(d) { return d; })
      .attr("checked", function(d, i) { if (i === 0) { return "checked"; } })
      .on("change", function change() {
        nodeInfoKey = this.value;
        nodeInfos.nodeInfoKey = nodeInfoKey;
        console.log("nodeInfokey: "+ nodeInfoKey);
        updateNodeInfo(rootSelection);
      }); 

    divNim.append("label")
      .text(function(d) { return d; });
      
    divNim.append("br");        
  }

  function displayPathsMenu(rootSelection){
    // paths info menu  
    if (typeof pathFile === "undefined") { return;}

    let currentRow;
    let currentCol;
    let pathInfoMap;
    let pathNames;

    let colRow = getColRowOfSingle(rootSelection);
    currentCol = allGraphs[colRow.col][colRow.row].dimCol;
    currentRow = allGraphs[colRow.col][colRow.row].dimRow;

    if (currentCol === "") {currentCol = 0;}
    if (currentRow === "") {currentRow = 0;}
    
    if (Object.keys(pathFile[0]).length === 8) { // cols and rows
      let row = Object.keys(pathFile[0])[5]; 
      let col = Object.keys(pathFile[0])[6]; 
      pathInfoMap = d3.nest()
        .key(function(d) { return d[row]; })
        .key(function(d) { return d[col]; })
        .key(function(d) { return d.name; })
        .object(pathFile);
    } else if (Object.keys(pathFile[0]).length === 7) { // rows
      let row = Object.keys(pathFile[0])[5];  
      pathInfoMap = d3.nest()
        .key(function(d) { return d[row]; })
        .key(function() { return 0; })
        .key(function(d) { return d.name; })
        .object(pathFile);
    } else if (Object.keys(pathFile[0]).length === 6) { // no rows or columns
      pathInfoMap = d3.nest()
        .key(function() { return 0; })
        .key(function() { return 0; })
        .key(function(d) { return d.name; })
        .object(pathFile);
    } else console.log("Error with number of attributes in paths file!");

    if (typeof pathInfoMap[currentRow] === "undefined") { return; 
    } else if (typeof pathInfoMap[currentRow][currentCol] === "undefined") { return; }
    
    pathNames = Object.keys(pathInfoMap[currentRow][currentCol]);
    
    if (debugOn) {
      console.log("pathFile: ");
      console.log(pathFile);
    }
    var divPm = rootSelection.select("div.sankeyMenu")
        .append("div")
        .attr("class", "PathsMenu")
        .style("opacity", 0);
   
    divPm.append("div")
        .attr("class", "titleMenu")
        .append("label")
        .text("show path");
          
    var div4 = divPm.selectAll("span")
      .data(pathNames) 
      .enter()
      .append("span");

    div4.append("input")
      .attr("class", "pathInfo")
      .attr("type", "checkbox")
      .attr("value", function(d) { return d; })
    //  .attr("checked", function(d, i) { if (i === 0) { return "checked"; } })
      .on("change", function(d) { showRemoveParticles(rootSelection,d); });
    
    div4.append("label")
      .text(function(d) { return d; });
    
    div4.append("br");  

    let trans = d3.transition().duration(1000);
    rootSelection.select("div.PathsMenu").transition(trans).style("opacity", 1);
  }

  function removePathsMenu(rootSelection) {
    let trans = d3.transition().duration(1000);
    rootSelection.select("div.PathsMenu").transition(trans).style("opacity", 0).remove();
    rootSelection.selectAll("canvas.particles").remove();
  }

  function showRemoveParticles(rootSelection, _pathName) {
    if (!d3.select(this).node().checked) { 
      myParticles = myParticles.stop(rootSelection, _pathName);
      console.log("stopped!");
    }
    else {
      if (rootSelection.select("g.sankeyFrame.single").size() === 0) { return; }

      let colRow = getColRowOfSingle(rootSelection);
      var keyCol = colRow.col;
      var keyRow = colRow.row; 
      var key = rootSelection.select("g.sankeyFrame.single").attr("class").split(" ")[1];

      var myPath = [];
      var sequenceStart; 
      var sequenceStartIndex = sequence.length-1;
      var myPathValue;

      var mySankey = allGraphs[keyCol][keyRow].sankey;  
      if (scaleGlobal) {mySankey.maxValue(allGraphs.maxValue);}
      else {mySankey.maxValue(-1);}

      pathFile.forEach( function(ele){
        if (ele.name === _pathName) {
          myPath.push({sx: ele.sourceX, sy: ele.sourceY, tx: ele.targetX, ty: ele.targetY, value: +ele.value});
          if (!myPathValue) {myPathValue = +ele.value;}
          if (sequence.indexOf(ele.sourceX) < sequenceStartIndex) {
            sequenceStartIndex = sequence.indexOf(ele.sourceX);
          }
        }
      });
      sequenceStart = sequence[sequenceStartIndex];

      if (debugOn) {
        console.log(myPath);
        console.log(myPathValue);
      }
      myParticles = myParticles.init(rootSelection, classPaths.get(key), props.particleStart, _pathName,
        myPath, sequenceStart, mySankey.maxValue(), myPathValue, 
        particleMin, particleMax, particleSpeed, particleShape, particleSize, nodeWidth, debugOn)
        .start();
    }
    return;
  }

  // method called when menu: options-> global scaling is changed  
  function updateScaling(rootSelection) {
    var mySankey;
    var parentSelector;
    var graph;
    var trans = d3.transition().duration(1000);

    scaleGlobal = rootSelection.select(".nodeScaling").node().checked;

    allGraphs.forEach( function (col, colIndex) {
      col.forEach( function (container, rowIndex) {
        mySankey = container.sankey;
        graph = container.graph;
      
        if (scaleGlobal) {mySankey.maxValue(allGraphs.maxValue);}
        else {mySankey.maxValue(-1);}
        mySankey.layout();   
      
      // transition links
        parentSelector = "g.sankeySeq.s" + colIndex + "-" + rowIndex;
        rootSelection.select(parentSelector).selectAll(".link")
        .data(graph.links, function(d) { return d.id; }) // data join for clarity. Data attributes have been changed even without join!
        .transition(trans)
        .attr("d", mySankey.link())
        .style("stroke-width", function(d) { return Math.max(1, d.dy) + "px"; });
        
      // transition nodes
        rootSelection.select(parentSelector).selectAll(".node")
         .data(graph.nodes)
         .transition(trans)
         .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"; });
        
        rootSelection.select(parentSelector).selectAll("rect.sankeyNode")
         .transition(trans)
         .attr("height", function(d) { return d.dy; });
   
        rootSelection.select(parentSelector).selectAll("text.nodeLabel")
         .transition(trans)        
         .attr("y", function(d) {  // adjustment if text would cross x axis    
           if (debugOn) {
             var transNode = getTranslation(d3.select(this.parentNode).attr("transform"))[1];
             console.log("transform: " + d3.select(this.parentNode).attr("transform"));
             console.log(transNode);
           }     
           var pyHeight = parseInt(d3.select(this).style("font-size")); 
           return d.dy < pyHeight ? d.dy - pyHeight / 2 - 2 : Math.min(d.dy / 2, d.dy - pyHeight / 2 - 2);           
         });
        
        rootSelection.select(parentSelector).selectAll("rect.sankeyNodeInfo")
         .filter(function(d) { nodeInfoKeys.forEach( function(key) {
           if (key !== nodeInfoNone) {// skip case for no nodeInfo selection
             d.nodeInfos[key + "_dy"] = mySankey.getNodeHeight(+d.nodeInfos[key]);
           }
           else {
             if (nodeInfoKey === nodeInfoNone) {
               rootSelection.selectAll("rect.sankeyNodeInfo").attr("y", function(d) {return d.dy;});
             }
           }
         });
           return (typeof d.nodeInfos !== "undefined"); })
        .attr("height", function() { 
          return d3.select(this).attr("height");
        })
        .transition(trans)
        .attr("y", function(d) {
          if (nodeInfoKey === nodeInfoNone) { return d.dy; }
          else {
            if (debugOn) {
              console.log("value: " + +d.nodeInfos[nodeInfoKey]);
              console.log("newHeight: " + d.nodeInfos[nodeInfoKey + "_dy"]);
            } 
            return d.dy - d.nodeInfos[nodeInfoKey + "_dy"];
          }
        })
        .attr("height", function(d) { 
          if (nodeInfoKey === nodeInfoNone) { return 0; }
          else {return d.nodeInfos[nodeInfoKey + "_dy"]; }
        }); 
      });
    });
  }
  
  function updateNodeLabels(rootSelection) {
    rootSelection.selectAll("text.nodeLabel").style("display", function() {
      return rootSelection.select(".labelOnOff").node().checked ? "block" : "none";
    });
  }
  
  function updateNodeInfo(rootSelection) {
    var trans = d3.transition().duration(1000);
    var borderCol = rootSelection.select("rect.sankeyNodeInfo").style("fill");
    var backgroundCol = d3.color(borderCol).rgb(); 
    backgroundCol.opacity = 0.1; 
    rootSelection.select("div.NodeInfoMenu")
      .transition(trans)
      .style("border-color", function() { return (nodeInfoKey === nodeInfoNone) ? "rgba(0,0,0,0.1)" : borderCol;})
      .style("background-color", function() { 
        return (nodeInfoKey === nodeInfoNone) ? "rgba(0,0,0,0.1)" : backgroundCol.toString();}); 

    rootSelection.selectAll("rect.sankeyNodeInfo")
      .style("display", "inline")  // reset style to inline if switch from none to other
      .transition(trans)
      .attr("y", function(d) { return d3.select(this).classed("zoomed") ? 
          d.nodeInfos[nodeInfoKey + "_transY"] : d.dy - d.nodeInfos[nodeInfoKey + "_dy"];})
      .attr("height", function(d) { return d3.select(this).classed("zoomed") ? 
          d.nodeInfos[nodeInfoKey + "_transHeight"] : d.nodeInfos[nodeInfoKey + "_dy"];})
      .transition()
      .delay(10)
      .duration(10)
      .style("display", function() { // set style to none if switch from other to none
        if (nodeInfoKey === nodeInfoNone) { return "none"; }
        else { return "inline";} 
      });
  }
  
  ////////////////////////////////////////////////////
  // 4.0 add visualization specific processing here //
  //////////////////////////////////////////////////// 
  
  function createChart(selection) {
    var sankey; // sankeySeq
    var width; // width of drawing area within SVG
    var height; // height of drawing area within SVG
    var sankeyG; // group element containing the sankeySeq graph
    var sankeyF; // group element containing the sankeyFrame = sankeySeq graph + axes/titles
    var node; // selection with nodes
    var graph; // graph for each sankeySeq
    var transformString; // object that transform strings for transitioning between small multiples and single
    var svg; 
    
    selection.each(function () {
      var rootSelection = d3.select(this);
        // 4.1 insert code here  
      displaySankeyMenu(rootSelection);
        
      svg = rootSelection.append("div")
          .attr("class", "sankeyChart")
        .append("svg")
          .attr("width", size[0])
          .attr("height", size[1])
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
      // drawing axes
      props = initialize_whp_and_axes(svg, size, margin, categories, sequence, nodeWidth);
      if (allGraphs.cols === 1 && allGraphs.rows === 1) {
        rootSelection.selectAll(".axis").style("opacity", 1);
        rootSelection.selectAll(".sankeyNode,.sankeyNodeInfo").style("stroke-width", "1px");
        rootSelection.select("g.sankeyFrame").classed("single", true);
        visMode = SINGLE; 
      }
      width = props.width;
      height = props.height;
      
      if (debugOn) { console.log("allGraphs:"); console.log(allGraphs); }
      
      allGraphs.forEach( function (col, colIndex) {
        col.forEach( function (container, rowIndex) {
          graph = container.graph;
          if (debugOn) {
            console.log("col: " + container.dimCol);
            console.log("row: " + container.dimRow);
          }       
          
          // setting up sankeySeq
          // sankey = d3.sankeySeq()
          sankey = sankeySeq()
            .size([width, height])
            .sequence(sequence) 
            .categories(categories)
            .nodeWidth(nodeWidth)
            .nodePadding(nodePadding)
            .nodes(graph.nodes)
            .links(graph.links)
            .correspondingCategories(chartAPI.correspondingEvents())
            .debugOn(debugOn);
          
          if (scaleGlobal) {sankey.maxValue(allGraphs.maxValue);}
          sankey.layout().addValues();   
          container.sankey = sankey;
          transformString = initializeFrame(svg, props, allGraphs, colIndex, rowIndex);

          rootSelection.select("div.sankeyChart > svg")
          .on("click", function () { // after click anywhere in svg, return to single mode
            if (visMode === ZOOMX) { 
              if (rootSelection.select(".nodeScaling").size > 0) {
                rootSelection.select(".nodeScaling").node().disabled = false;
              }
              rootSelection.select(".labelOnOff").node().disabled = false;
              let nameX = rootSelection.select("g.zoomed").classed("zoomed", false).datum();
              transitionXaxisBack(rootSelection, corrCategories, nameX, nodeInfos);
              displayPathsMenu(rootSelection);
              visMode = SINGLE;
            } else if (visMode === ZOOMY) { 
              if (rootSelection.select(".nodeScaling").size > 0) {
                rootSelection.select(".nodeScaling").node().disabled = false;
              }
              rootSelection.select(".labelOnOff").node().disabled = false;
              rootSelection.select("g.zoomed").classed("zoomed", false);
              transitionYaxisBack(rootSelection);
              displayPathsMenu(rootSelection);
              visMode = SINGLE;
            }
          });

          sankeyF = svg.append("g")
          .datum(transformString.sankeyFrame)
          // .attr("class", "sankeyFrame f" + colIndex + "-" + rowIndex)
          .attr("class", function(){ 
            let c = "sankeyFrame f" + colIndex + "-" + rowIndex; 
            c += (allGraphs.cols === 1 && allGraphs.rows === 1) ? " single" : " multiples";
            return c;})
          .attr("transform", transformString.sankeyFrame.multiples)
          .on("click", function () {   
            if (!(allGraphs.cols === 1 && allGraphs.rows === 1)) {
              if (visMode === MULTIPLES) {
                transitionToSingle(svg, this);
                displayPathsMenu(rootSelection);
                visMode = SINGLE;
              } else if (visMode === SINGLE) {
                transitionToMultiples(svg, this);
                removePathsMenu(rootSelection);
                visMode = MULTIPLES;
              }
            }         
          }); 
          
          sankeyG = sankeyF.append("g")
            .datum(transformString.sankeySeq)
            .attr("class", "sankeySeq s" + colIndex + "-" + rowIndex)
            .attr("transform", transformString.sankeySeq.multiples);
          
          var topP = sankeyF.append("g")
            .datum(transformString.pTop)
            .attr("class", "sankeyPad multiples pTop")
            .attr("transform", transformString.pTop.multiples);
            
          topP.append("text")
            .attr("class", "multiples col c" + colIndex)
            .text(function() {
              var topLabel = ""; // for single Sankey no title
              if (allGraphs.cols === 1 && allGraphs.rows > 1) { topLabel = container.dimRow;} // switch label to top
              else {
                topLabel = container.dimCol;
              }
              return topLabel;
            });         
            
          topP.append("text")
            .attr("class", "single col c" + colIndex)
            .style("opacity", 0)
            .text(function() {
              var topLabel = ""; // for single Sankey no title
              if (allGraphs.cols === 1 && allGraphs.rows > 1) { topLabel = container.dimRow;} // switch label to top
              else {
                topLabel = container.dimRow + "\u00A0\u00A0\u00A0\u00A0" + container.dimCol;
              }
              return topLabel;
            }); 
          
          sankeyF.append("g")
            .datum(transformString.pLeft)
            .attr("class", "sankeyPad multiples pLeft")
            .attr("transform", transformString.pLeft.multiples)
            .append("text")
            .attr("class", "multiples row r" + rowIndex)
            .attr("transform", "rotate(-90)")
            .text(function() {
              var topLabel = ""; // for single Sankey and one dimension no title
              if (allGraphs.cols > 1 && allGraphs.rows > 1) { topLabel = container.dimRow;} 
              return topLabel;
            });         

          // rect as selection area
          sankeyG.append("rect")
            .attr("class", "coverSankeySeq")
            .attr("height", height)
            .attr("width", width + 2) // otherwise global scale transition leads to stroke rendering issues on the rightmost nodes 
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("fill-opacity", 0);
          
          // tooltip
          tooltip = d3.select("body").append("div").attr("class", "tooltipSankeySeq");
            
          // drawing links
          sankeyG.append("g")
            .attr("class", "links")
            .selectAll(".link")
            .data(graph.links)
          .enter().append("path")
            .attr("class", function(d) { return "link" + " lsx" + d.source.nameX.replace(/ /g, "_")
              + " lsy" + d.source.nameY.replace(/ /g, "_")
              + " ltx" + d.target.nameX.replace(/ /g, "_")
              + " lty" + d.target.nameY.replace(/ /g, "_"); })
            .attr("d", sankey.link())
            .style("stroke-width", function(d) { return Math.max(1, d.dy) + "px"; })
            .sort(function(a, b) { return b.dy - a.dy; })
            .each(function(d,i, nodes){
              if (i === 0) {pathsArray = [];}
              pathsArray.push(this);
              if (i === nodes.length -1) {classPaths.set("f" + colIndex + "-" + rowIndex, pathsArray);}
            })
            .on("mouseover", function(d) {
              var info = sequenceName + ": " + d.source.nameX + " \u21FE " + d.target.nameX;
              info += "<br>" + categoryName + ": " + d.source.nameY + " \u21FE " + d.target.nameY;
              info += "<br>" + valueName + ": " + formatNumber(d.value, thousandsSeparator, ",.0f");
              if (d.additionalLabel != null) {
                info += "<br>" + d.additionalLabel;
              }
              tooltip.html(info);
              tooltip.style("visibility", "visible");
            })
            .on("mousemove", function() {
              var twidth = 19; // padding + border + 5
              var theight = 19; // padding + border + 5
              
              var index = tooltip.style("width").indexOf("px");
              if(index != -1)
                twidth += +tooltip.style("width").substr(0, index);
                
              index = tooltip.style("height").indexOf("px");
              if(index != -1)
                theight += +tooltip.style("height").substr(0, index);
           
              var top = (d3.event.pageY - 100 < 0) ? d3.event.pageY + 23 : d3.event.pageY - theight;
              var left = (d3.event.pageX + 250 < window.innerWidth) ? d3.event.pageX + 5 : d3.event.pageX - twidth;

              return tooltip.style("top", top +"px").style("left", left +"px");
            })
            .on("mouseout", function() {
              return tooltip.style("visibility", "hidden");
            });
         
          // drawing nodes
          node = sankeyG.append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data(graph.nodes)
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

          node.append("rect")
            .attr("class", function(d) {
              var res = "sankeyNode" + " nx" + d.nameX.replace(/ /g, "_") + " ny" + d.nameY.replace(/ /g, "_");
              categories.forEach( function(cat, i) {
                if (cat === d.nameY) {
                  res += " color" + (i % 5);
                }
              });
              return res;
            })
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            .on("mouseover", function(d) {
              var info = sequenceName + ": " + d.nameX;
              info += "<br>" + categoryName + ": " + d.nameY;
              info += "<br>" + valueName + ": " + formatNumber(d.value, thousandsSeparator, ",.0f");
              percentages.forEach(function(line){
                if (line === "%sameTime") {
                  if (corrCategories().length === categories.length) {
                    info += "<br>% of '" + d.nameX + "': " + formatNumber("" + (d.value/d.valueX), thousandsSeparator, ",.1%");
                  } else {
                    info += "<br>% of '" + d.nameX + "'(CE): " + formatNumber("" + (d.value/d.valueXCorr), thousandsSeparator, ",.1%");
                  }
                } else if (line === "%sameEvent") {
                  info += "<br>% of '" + d.nameY + "': " + formatNumber("" + (d.value/d.valueY), thousandsSeparator, ",.1%");
                } else if (line === "%prevEvent") {
                  info += "<br>% of previous '" + d.nameY + "': " + formatNumber("" + (d.value/d.valueYPrev), thousandsSeparator, ",.1%");
                } else if (line === "%firstEvent") {
                  info += "<br>% of first '" + d.nameY + "': " + formatNumber("" + (d.value/d.valueYFirst), thousandsSeparator, ",.1%");
                }
              });
              tooltip.html(info);
              tooltip.style("visibility", "visible");
            })
            .on("mousemove", function(){ positionTooltipNode(tooltip); } )
            .on("mouseout", function() {
              return tooltip.style("visibility", "hidden");
            });
          
          // var yOfBottomAxis = parseInt(d3.select("rect.coverSankeySeq").attr("height"));
          node.append("text")
            .attr("class", "nodeLabel")
            .style("display", function() { 
              return rootSelection.select(".labelOnOff").node().checked ? "block" : "none";})
            .attr("x", 3 + sankey.nodeWidth())
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("transform", null)
            .style("opacity", 0)
            .text(function(d) { return d.nameY; })
          .each(function() { // adjust height for lowest category in case text overlaps with x axis
            if (debugOn) {
              console.log( d3.select(this.parentNode).node()); 
              console.log("transform: " + d3.select(this.parentNode).attr("transform"));
            } 
            // var transNode = getTranslation(d3.select(this.parentNode).attr("transform"))[1];
            var pyHeight = parseInt(d3.select(this).style("font-size"));    
            d3.select(this).attr("y", function(d) { 
              return d.dy < pyHeight ? d.dy - pyHeight / 2 - 2 : Math.min(d.dy / 2, d.dy - pyHeight / 2 - 2);
            });
          })  
          .filter(function(d) { return d.x > width * .9; })
            .attr("x", -3)
            .attr("text-anchor", "end");
            // .attr("transform", function(d) { return "translate (" + ((d.dy / 2) + 30) + "," + (d.dy / 2) + ") rotate(90)"; }); 

          //drawing nodeInfos
          node.filter(function(d) { return (typeof d.nodeInfos !== "undefined"); }) // display nodeInfos
            .append("rect")
            .attr("class", "sankeyNodeInfo")
            .attr("y", function(d) { return d.dy;})
            .attr("height", function(d) { 
              nodeInfoKeys.forEach( function(key) {
                d.nodeInfos[key + "_dy"] = sankey.getNodeHeight(+d.nodeInfos[key]);
              });
              return 0; })
            .attr("width", sankey.nodeWidth())
            .style("display", function() { // set style to none if nodeInfo == none
              if (nodeInfoKey === nodeInfoNone) { return "none"; }
              else { return "inline";} 
            })
            .on("mouseover", function(d) {
              var info = sequenceName + ": " + d.nameX;
              info += "<br>" + categoryName + ": " + d.nameY;
              info += "<br>" + valueName + " ("+ nodeInfoKey + "): " + formatNumber(d.nodeInfos[nodeInfoKey], thousandsSeparator, ",.0f");
              info += "<br>% of node: " + formatNumber("" + (d.nodeInfos[nodeInfoKey]/d.value), thousandsSeparator, ",.1%");
              tooltip.html(info);
              tooltip.style("visibility", "visible");
            })
            .on("mousemove", function(){ positionTooltipNode(tooltip); } )
            .on("mouseout", function() {
              return tooltip.style("visibility", "hidden");
            });
            
          if (container.transform === "single") { 
            transitionToSingle(svg, sankeyF.node(), d3.transition().duration(0));
          }

          if (allGraphs.cols === 1 && allGraphs.rows === 1) {displayPathsMenu(rootSelection);}
          
          rootSelection.selectAll("g.axis.bottom > g.tick").on("click", function(d){
            if (visMode === SINGLE) {
              if (skipX(d)) { return; }

              if (rootSelection.select(".nodeScaling").size > 0) {
                rootSelection.select(".nodeScaling").node().disabled = true;
              }
              rootSelection.select(".labelOnOff").node().checked = false;
              updateNodeLabels(rootSelection);
              rootSelection.select(".labelOnOff").node().disabled = true;
              d3.select(this).classed("zoomed", true);
              resort(corrCategories);
              removePathsMenu(rootSelection);
              transitionXaxis(rootSelection, corrCategories, d, nodeInfos, thousandsSeparator);
              d3.event.stopPropagation();
              visMode = ZOOMX;
            } 
          });    

          rootSelection.selectAll("g.axis.bottom > g.tick").on("mouseover", function(dFirst){
            if (skipX(dFirst)) {
              d3.select(this).style("cursor", "default");
              return;
            }

            d3.select(this).style("cursor", "pointer");
            let bbox = d3.select(this).selectAll("text").node().getBBox();
            let w = bbox.width/2 + 2;
            let of = 0.5; // offset
            let h = bbox.height;
            let pd = "M" + of + " 0 L" + -(of + w + 3) + " 8 L" + -(of + w) + " 8 L" + -(of + w) + " " + (h + 11);
            pd += " L" + (of + w) + " " + (h + 11) + " L" + (of + w) + " 8 L" + (of + w + 3) + " 8 Z";

            d3.select(this).selectAll("path")
              .data([dFirst], function(d){ return d;})
              .enter()
              .append("path")
              .attr("d", pd);
          }).on("mouseleave", function(){ 
            d3.select(this).selectAll("path").remove(); 
            d3.select(this).style("cursor", "default"); 
          });         
          
          // helper to skip mouse event handling
          function skipX(da) {
            let skipYes = false;
            let cond1 = ((visMode === ZOOMY) || (visMode === ZOOMX));
            let numberNodes = rootSelection.select("g.sankeyFrame.single")
                .selectAll("g.node")
                .filter( d => d.nameX === da);
            let cond2 = (numberNodes.size() === 0);
            let numberNodes2 = numberNodes
                .filter( d => corrCategories().indexOf(d.nameY) !== -1)
                .size();
            let cond3 = (numberNodes2 === 0);

            skipYes = cond1 || cond2 || cond3;
            return skipYes;
          }    

          // in case the specified order of correspondingEvents() does not match eventOrder()
          function resort(_corrCategories) {
            let ar1 = _corrCategories();
            let ar2 = ar1.sort(function(a, b){ return categories.indexOf(a) - categories.indexOf(b);});
            _corrCategories = function(){return ar2;};
          }            

          rootSelection.selectAll("g.axis.left > g.tick").on("click", function(d){
            if (visMode === SINGLE) {
              if (skipY(d)) { return; }

              d3.select(this).classed("zoomed", true);
              if (rootSelection.select(".nodeScaling").size > 0) {
                rootSelection.select(".nodeScaling").node().disabled = true;
              }
              rootSelection.select(".labelOnOff").node().checked = false;
              updateNodeLabels(rootSelection);
              rootSelection.select(".labelOnOff").node().disabled = true;
              removePathsMenu(rootSelection);
              transitionYaxis(rootSelection, d, thousandsSeparator, percentages[0], sequence[0]);
              d3.event.stopPropagation();
              visMode = ZOOMY;
            } 
          });  

          rootSelection.selectAll("g.axis.left > g.tick").on("mouseover", function(dFirst){
            if (skipY(dFirst)) {
              d3.select(this).style("cursor", "default");
              return;
            }

            d3.select(this).style("cursor", "pointer");
            let bbox = d3.select(this).selectAll("text").node().getBBox();
            let w = bbox.width;
            let of = bbox.y + bbox.height/2; // offset
            let h = bbox.height/2 + 2;
            let pd = "M0 " + of + " L-10 " + (of + h + 3) + " L-10 " + (of + h) + " L" + -(w + 12) + " " + (of + h);
            pd += " L" + -(w + 12) + " " + (of-h) + " L-10 " + (of - h) + " L-10 " + (of - h - 3) + " Z";

            d3.select(this).selectAll("path")
              .data([dFirst], function(d){ return d;})
              .enter()
              .append("path")
              .attr("d", pd);
          }).on("mouseleave", function(){ 
            d3.select(this).selectAll("path").remove(); 
            d3.select(this).style("cursor", "default"); 
          });  

          // helper to skip mouse event handling
          function skipY(da) {
            let skipYes = false;
            let cond1 = ((visMode === ZOOMY) || (visMode === ZOOMX));
            let numberNodes = rootSelection.select("g.sankeyFrame.single")
                .selectAll("g.node")
                .filter( d => d.nameY === da)
                .size();
            let cond2 = (numberNodes === 0);
            let cond3 = (percentages[0] === "%sameTime" && corrCategories().indexOf(da) === -1);

            skipYes = cond1 || cond2 || cond3;
            return skipYes;
          }                
        });
      });  
    });
  }
   
  // 4.2 update functions

  ////////////////////////////////////////////////////
  // 5.0 processing data begins here                //
  //////////////////////////////////////////////////// 
  
  // 5.1 adjust for visualization specific data processing
  // XHR to load data   
  function readData(csvFile, selection) {
    if (csvFile !== "<pre>") {
      var suffix = csvFile.split(".")[csvFile.split(".").length-1];
      if (suffix !== "csv" && suffix !== "json") { 
        console.log("Wrong suffix (neither csv nor json): " + csvFile);
      } else if (suffix === "json") {
        readJson(csvFile, selection);
      } else { 
        readCsv(csvFile, selection);
      }
    } 
    else { // data embedded in html file
      if (d3.select("pre#data").size() !== 0) { file = d3.csvParse(d3.select("pre#data").text());
      } else { console.log("no data found in pre#data!");}
      if (d3.select("pre#dataNodes").size() !== 0) { 
        let content = d3.select("pre#dataNodes").text();
        if (content !== "") {nodeFile = d3.csvParse(content);} 
      }
      if (d3.select("pre#paths").size() !== 0) { 
        let content = d3.select("pre#paths").text();
        if (content !== "") {pathFile = d3.csvParse(content);} 
      }
      
      if (debugOn) {
        console.log("file: ");
        console.log(file);
        console.log("nodeFile: ");
        console.log(nodeFile);        
      }

      if (debugOn) {
        console.log("file: ");
        console.log(file);
        console.log("pathFile: ");
        console.log(pathFile);        
      }      
      allGraphs = constructSankeyFromCSV(file); // main data structure build from csv file
      createChart(selection);
    }
  } 

  // 5.2 reads data from a csv file
  function readCsv (csvFile, selection) {
    d3.csv(csvFile, function(error1, f) {
      var nodeFileName = csvFile.slice(0, csvFile.lastIndexOf(".")) + "_nodes" + csvFile.slice(csvFile.lastIndexOf("."));
      d3.csv(nodeFileName, function(error2, nf) { // load infos from optional nodeInfo file
        if (debugOn) {
          console.log("start");
          console.log(error2);
          console.log(nf);
          console.log("end");
        } 
        nodeFile = nf;
        file = f;

        if (debugOn) {
          console.log("file: ");
          console.log(file);
          console.log("nodeFileName: ");
          console.log(nodeFileName);
          console.log("nodeFile: ");
          console.log(nodeFile);
        }
        var pathFileName = csvFile.slice(0, csvFile.lastIndexOf(".")) + "_paths" + csvFile.slice(csvFile.lastIndexOf("."));
        d3.csv(pathFileName, function(error3, pf) { // load paths from optional show path file
          pathFile = pf;
          if (debugOn) {
            console.log("pathfile error:");
            console.log(error3);
            console.log("pathfile:");
            console.log(pathFile);
            console.log("end");
          } 
          allGraphs = constructSankeyFromCSV(file); // main data structure build from csv file           
          createChart(selection);
        });
      });       
    });
  }

  // 5.3.a reads data from a json file
  function readJson (csvFile, selection) {
    d3.json(csvFile, function(error1, f) {
      if (debugOn) {
        console.log("start");
        console.log(error1);
        console.log(f);
        console.log("end");
      }
      loadData(f, selection);
    });      
  }

  // 5.3.b load the Data
  function loadData (f, selection){

    if (!f["data"]) {console.log (" --> No data key found in JSON file"); }
    else { file = f["data"]; file.columns = Object.keys(file[0]); }

    if (!f["dataNodes"]) {console.log (" --> No dataNodes key found in JSON file"); }
    else { nodeFile = f["dataNodes"]; nodeFile.columns = Object.keys(nodeFile[0]); }

    if (!f["paths"]) {console.log (" --> No paths key found in JSON file"); }
    else { pathFile = f["paths"]; pathFile.columns = Object.keys(pathFile[0]); }

    allGraphs = constructSankeyFromCSV(file); // main data structure build from JSON file
    createChart(selection);
  }

  // 5.4 processes sankey from a csv file. Returns the necessary graph data structure. 
  // based on the approach from timelyportfolio, see http://bl.ocks.org/timelyportfolio/5052095
  function constructSankeyFromCSV(_file) {
    //set up graph in same style as original example but empty
    var graph = {}; 
    var allGraphs = []; // array of graphs
    var source, target;
    var columns = _file.columns;
    var dataGroups = [];
    var nodeMap = d3.map();
    var hashKey;
    var data; // data from each group (categories of dimension)
    var container;
    var sourceValues, targetValues; // for iterating over value to find maxValue
    var value, maxValue = 0; // maxValue for scaling option 
    let sequenceSet = d3.set();
    let categorySet = d3.set();
    
    console.log(_file.columns);
    if (typeof valueName === "undefined") {valueName = _file.columns[0];}
    
    // processing main file first
    if (_file.columns.length === 5)  { // standard case
      dataGroups = d3.nest()
        .key(function() { return ""; })
        .key(function() { return ""; })
        .entries(_file);
        
      if (typeof nodeFile !== "undefined") {
        nodeFile.forEach(function(node){
          hashKey = node["sourceX"] + "," + node["sourceY"];              
          nodeMap.set(hashKey, node);
          if (debugOn) { console.log(node);}
        });   
        nodeInfoKeys = nodeFile.columns;
        nodeInfoKeys.splice(0,2,nodeInfoNone);  
      }
    } else if (_file.columns.length === 6)  { // one additional dimension
      dataGroups = d3.nest()
        .key(function() { return ""; })
        .key(function(d) { return d[columns[5]]; }).sortKeys(orderDimension(rowOrder))
        .entries(_file);
        
      if (typeof nodeFile !== "undefined") {
        nodeFile.forEach(function(node){
          hashKey = node[_file.columns[5]] + "," + node["sourceX"] + "," + node["sourceY"];             
          nodeMap.set(hashKey, node);
          if (debugOn) { console.log(node);}
        });   
        nodeInfoKeys = nodeFile.columns;
        nodeInfoKeys.splice(0,3,nodeInfoNone);  
      }
    } else if (_file.columns.length >= 7)  { // two additional dimensions
      dataGroups = d3.nest()
        .key(function(d) { return d[columns[6]]; }).sortKeys(orderDimension(colOrder))
        .key(function(d) { return d[columns[5]]; }).sortKeys(orderDimension(rowOrder))
        .entries(_file);
        
      if (debugOn) { console.log("----------- nodeInfos ------------");}
      if (typeof nodeFile !== "undefined") {
        nodeFile.forEach(function(node){
          hashKey = node[_file.columns[6]] + "," + node[_file.columns[5]] + "," + node["sourceX"] + "," + node["sourceY"];              
          nodeMap.set(hashKey, node);
          if (debugOn) { console.log(node);}
        });   
        nodeInfoKeys = nodeFile.columns;
        nodeInfoKeys.splice(0,4,nodeInfoNone);  
      }
    }
    
    allGraphs.rows = d3.nest()
               .key(function(d) { return d[columns[5]];})
               .entries(_file)
               .length;
               
    allGraphs.cols = d3.nest()
               .key(function(d) { return d[columns[6]];})
               .entries(_file)
               .length;          
    
    if (debugOn) {  
      console.log("----------- datagroups ------------");
      console.log(dataGroups);
      console.log("----------nodeMap----------");
      console.log(nodeMap);
    }     
    
    // create data structure containing data in the right representation    
    dataGroups.forEach(function (dim2, col) {
      allGraphs[col] = [];
      dim2.values.forEach(function(dim1) {
        data = dim1.values;
        graph = {"nodes" : [], "links" : []}; 

        if (debugOn) {console.log("graph0: ");}
        
        data.forEach(function (d, i) {          
          if (debugOn) {
            console.log("i: " + i);
            console.log(d);
          }
          
          // data is derived from the hard-coded column order
          source = d[columns[1]] + "_" + d[columns[2]];
          target = d[columns[3]] + "_" + d[columns[4]];   
          graph.nodes.push({ "name": source });
          graph.nodes.push({ "name": target });
          graph.links.push({ "source": source,
            "target": target,
            "id": source + "->" + target,
            "value": +d[columns[0]],
            "additionalLabel": d[columns[7]]
          });

          // build sets for sequence and categories
          sequenceSet.add(d[columns[1]]);
          sequenceSet.add(d[columns[3]]);
          categorySet.add(d[columns[2]]);
          categorySet.add(d[columns[4]]);
        });

        if (debugOn) {
          console.log("graph1: ");
          console.log(JSON.stringify(graph));
        }
         
        graph.nodes = d3.nest()
          .key(function (d) { return d.name; })
          .map(graph.nodes)
          .keys();
        
        if (debugOn) {      
          console.log("graph2: ");
          console.log(JSON.stringify(graph));
        } 
           
        // loop through each link replacing the text with its index from node
        graph.links.forEach(function (d, i) {
          graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
          graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
        });

        //now loop through each node to make nodes an array of objects
        // rather than an array of strings
        graph.nodes.forEach(function (d, i) {
          var xValue = d.split("_")[0];
          var yValue = d.split("_")[1];
          graph.nodes[i] = { "name": d, "nameX": xValue, "nameY": yValue };
          
          // add nodeInfos if available
          var nInfos;
          var firstPart = dim2.key === "" ? "" : dim2.key + ",";
          var secondPart = dim1.key === "" ? "" : dim1.key + ",";
          nInfos = nodeMap.get(firstPart + secondPart + xValue + "," + yValue);
            
          if (typeof nInfos !== "undefined") {
            Object.keys(nInfos).forEach(function(key) {
              nInfos[key + "_dy"] = 0;
            });
            nInfos[nodeInfoNone] = 0; // add this for later processing convenience
            graph.nodes[i].nodeInfos = nInfos;        
          }
        });
        
        if (debugOn) {
          console.log("graph 3");
          console.log(JSON.stringify(graph));
          console.log(graph);
        }
        
        if (debugOn) {
          console.log("categoriesSorted: ");
          console.log(categories);
        }
        
        container = {};
        container.graph = graph;

        container.dimRow = dim1.key;
        container.dimCol = dim2.key;
        
        // computing the value of the largest node
        sourceValues = d3.nest()
          .key(function(d) { return d.source; })
          .rollup(function(values) { return d3.sum(values, function(d) {return +d.value; }); })
          .entries(graph.links);
          
        targetValues = d3.nest()
          .key(function(d) { return d.target; })
          .rollup(function(values) { return d3.sum(values, function(d) {return +d.value; });})
          .entries(graph.links);  
        
        sourceValues = sourceValues.concat(targetValues);
        value = d3.max(sourceValues, function(d) {
          return d.value;});

        maxValue = value > maxValue ? value : maxValue; 
                
        if (allGraphs.cols === 1 && allGraphs.rows === 1) { container.transform = "single";} // standard case
        else { container.transform = "multiples";} // additional dimensions
        
        allGraphs[col].push(container);
      }); 
    });

    // assemble nodeInfos object for transitions
    nodeInfos.nodeInfoKeys = nodeInfoKeys;
    nodeInfos.nodeInfoNone = nodeInfoNone;
    nodeInfos.nodeInfoKey = nodeInfoKey;

    // get array of sequence and categories from sets
    let d_sequence = sequenceSet.values().sort(d3.ascending); 
    let d_categories = categorySet.values().sort(d3.ascending); 

    // output sequence and categories for debugging
    console.log(" data sequence: " + d_sequence);
    if (sequence) {
      console.log("input sequence: " + sequence);
    } else {
      sequence = d_sequence;
    }
    console.log(" data categories: " + d_categories);
    if (categories) {
      console.log("input categories: " + categories);
    } else {
      categories = d_categories;
    }

    if (debugOn) {console.log("maxValue: " + maxValue);}
    allGraphs.maxValue = maxValue;
    return allGraphs;
  } 
  return chartAPI;
}
