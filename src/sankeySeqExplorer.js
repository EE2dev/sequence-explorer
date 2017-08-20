import * as d3 from "d3";
import { default as sankeySeq } from "./sankeySeq";
import { positionTooltipNode, getTranslation, formatNumber, orderDimension } from "./helper";
import { initialize_whp_and_axes, initializeFrame } from "./initialize";
import { transitionToSingle, transitionToMultiples, transitionXaxis, transitionXaxisBack } from "./transition";

// var sequenceExplorerChart = function(_myData) {
// export function chart(_myData) {
export default function(_myData) {
  "use strict";
  
  // 0.1 All options not accessible to caller 
  var file; // reference to data (embedded or in file)
  var nodeFile; // optional file with additional node infos
  var nodeInfoKeys; // the key names of the additional node infos
  var nodeInfoNone = "(none)"; // displayed string for no info key
  var nodeInfoKey = nodeInfoNone; // the selected key
  var nodeInfos = {}; // Object containing the three variables above as properties 
  var valueName; // the column name of the frequency value
  var scaleGlobal = true; // scale the node height for multiples over all sankeys 
  var showNodeLabels = true; // show node labels
  var tooltipFormat = []; // format of the tooltip text
  var allGraphs; // data structure containing columns of rows of sankey input data;
  var tooltip;
  const SINGLE = 1; // single sankey diagram
  const MULTIPLES = 2; // small multiples diagramm
  const ZOOM = 3; // transitioned to a zoomed display of fractions
  let visMode = MULTIPLES;
  
  ///////////////////////////////////////////////////
  // 1.0 add visualization specific variables here //
  ///////////////////////////////////////////////////
  
  // 1.1 All options that should be accessible to caller  
  var debugOn = false,
    nodeWidth = 15,
    nodePadding = 8, 
    size = [700, 500],
    margin = {left: 5, top: 5, right: 5, bottom: 5},
    sequence,
    categories,
    colOrder,
    rowOrder,
    transitionX, // a function returning an array of categories (-> transition after clicking on the x axis)
    transitionY, // a function returning an array of categories (-> transition after clicking on the y axis)
    sequenceName = "sequence",
    categoryName = "category",
    thousandsSeparator = ",";

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
        if (typeof _myData !== "undefined") { 
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
  
  chartAPI.categoryOrder = function(_) {
    if (!arguments.length) return categories;
    categories = _;
    return chartAPI;
  };
  
  chartAPI.sequenceName = function(_) {
    if (!arguments.length) return sequenceName;
    sequenceName = _;
    return chartAPI;
  };
  
  chartAPI.categoryName = function(_) {
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

  chartAPI.tooltipFormat = function(_) {
    if (!arguments.length) return tooltipFormat;
    tooltipFormat = _;
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

  chartAPI.transitionX = function(_) { // returns a function that returns an array of categories
    if (!arguments.length) return transitionX();
    else {
      if (_ === true) {
        transitionX = chartAPI.categoryOrder;
      } else {
        transitionX = function() {return _;};
      }
      return chartAPI;
    }
  };

  chartAPI.transitionY = function(_) {
    if (!arguments.length) return transitionY;
    transitionY = _;
    return chartAPI;
  };

  ////////////////////////////////////
  // 3.0 add private functions here //
  ////////////////////////////////////
  
  // functions for building the menu
  function displaySankeyMenu(selection) {
    var div1 = selection.append("div").attr("class", "sankeyMenu");
    
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
        .on("change", updateScaling);
        
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
      .on("change", updateNodeLabels);
      
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
    var divNim = d3.select("div.sankeyMenu")
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
        updateNodeInfo();
      }); 

    divNim.append("label")
      .text(function(d) { return d; });
      
    divNim.append("br");        
  }

  // method called when menu: options-> global scaling is changed  
  function updateScaling() {
    var mySankey;
    var parentSelector;
    var graph;
    var trans = d3.transition().duration(1000);

    scaleGlobal = d3.select(".nodeScaling").node().checked;

    allGraphs.forEach( function (col, colIndex) {
      col.forEach( function (container, rowIndex) {
        mySankey = container.sankey;
        graph = container.graph;
      
        if (scaleGlobal) {mySankey.maxValue(allGraphs.maxValue);}
        else {mySankey.maxValue(-1);}
        mySankey.layout();   
      
      // transition links
        parentSelector = "g.sankeySeq.s" + colIndex + "-" + rowIndex;
        d3.select(parentSelector).selectAll(".link")
        .data(graph.links, function(d) { return d.id; }) // data join for clarity. Data attributes have been changed even without join!
        .transition(trans)
        .attr("d", mySankey.link())
        .style("stroke-width", function(d) { return Math.max(1, d.dy) + "px"; });
        
      // transition nodes
        d3.select(parentSelector).selectAll(".node")
         .data(graph.nodes)
         .transition(trans)
         .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"; });
        
        d3.select(parentSelector).selectAll("rect.sankeyNode")
         .transition(trans)
         .attr("height", function(d) { return d.dy; });
   
        // var yOfBottomAxis = parseInt(d3.select("rect.coverSankeySeq").attr("height"));
        d3.select(parentSelector).selectAll("text.nodeLabel")
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
        
        d3.select(parentSelector).selectAll("rect.sankeyNodeInfo")
         .filter(function(d) { nodeInfoKeys.forEach( function(key) {
           if (key !== nodeInfoNone) {// skip case for no nodeInfo selection
             d.nodeInfos[key + "_dy"] = mySankey.getNodeHeight(+d.nodeInfos[key]);
           }
           else {
             if (nodeInfoKey === nodeInfoNone) {
               d3.selectAll("rect.sankeyNodeInfo").attr("y", function(d) {return d.dy;});
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
  
  function updateNodeLabels() {
    d3.selectAll("text.nodeLabel").style("display", function() { 
      return d3.select(".labelOnOff").node().checked ? "block" : "none";});
  }
  
  function updateNodeInfo() {
    var trans = d3.transition().duration(1000);
    var borderCol = d3.select("rect.sankeyNodeInfo").style("fill");
    var backgroundCol = d3.color(borderCol).rgb(); 
    backgroundCol.opacity = 0.1;
    d3.select("div.NodeInfoMenu")
      .transition(trans)
      .style("border-color", function() { return (nodeInfoKey === nodeInfoNone) ? "rgba(0,0,0,0.1)" : borderCol;})
      .style("background-color", function() { 
        return (nodeInfoKey === nodeInfoNone) ? "rgba(0,0,0,0.1)" : backgroundCol.toString();}); 
          
    d3.selectAll("rect.sankeyNodeInfo")
      .style("display", "inline")  // reset style to inline if switch from none to other
      .transition(trans)
      /*
      .attr("y", d => (d3.select(this).classed("zoomed")) ? 
        d.nodeInfos[nodeInfoKey + "_transY"] : d.dy - d.nodeInfos[nodeInfoKey + "_dy"])
      */
      .attr("y", function (d) {
        return d3.select(this).classed("zoomed") ? 
          d.nodeInfos[nodeInfoKey + "_transY"] : d.dy - d.nodeInfos[nodeInfoKey + "_dy"];
      })
      .attr("height", function (d) {
        return d3.select(this).classed("zoomed") ? d.nodeInfos[nodeInfoKey + "_transHeight"] : d.nodeInfos[nodeInfoKey + "_dy"];
      })
     // .attr("height", d => (visMode === ZOOM) ? 
      /*
      .attr("height", d => (d3.select(this).classed("zoomed")) ? 
        d.nodeInfos[nodeInfoKey + "_transHeight"] : d.nodeInfos[nodeInfoKey + "_dy"])
      */
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
    var props; // properties calculated in initialization function
    var transformString; // object that transform strings for transitioning between small multiples and single
    var svg; 
    
    selection.each(function () {
        // 4.1 insert code here  
      displaySankeyMenu(selection); 
        
      svg = d3.select(this).append("div")
          .attr("class", "sankeyChart")
        .append("svg")
          .attr("width", size[0])
          .attr("height", size[1])
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
      // drawing axes
      props = initialize_whp_and_axes(svg, size, margin, categories, sequence, nodeWidth);
      if (allGraphs.cols === 1 && allGraphs.rows === 1) { 
        d3.selectAll(".axis").style("opacity", 1);
        d3.selectAll(".sankeyNode,.sankeyNodeInfo").style("stroke-width", "1px");
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
            .debugOn(debugOn);
          
          if (scaleGlobal) {sankey.maxValue(allGraphs.maxValue);}
          sankey.layout().addValues();   
          container.sankey = sankey;
          
          transformString = initializeFrame(svg, props, allGraphs, colIndex, rowIndex);

          d3.select("div.sankeyChart > svg")
          .on("click", function () { // after click anywhere in svg, return to single mode
            if (visMode === ZOOM) { 
              d3.select(".nodeScaling").node().disabled = false;
              d3.select(".labelOnOff").node().disabled = false;
              let nameX = d3.select("g.zoomed").classed("zoomed", false).datum();
              transitionXaxisBack(nameX); 
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
                transitionToSingle(this);
                visMode = SINGLE;
              } else if (visMode === SINGLE) {
                transitionToMultiples(this); 
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
          tooltip = d3.select("body").append("div").attr("class", "tooltip");
            
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
            .on("mouseover", function(d) {
              var info = sequenceName + ": " + d.source.nameX + " \u21FE " + d.target.nameX;
              info += "<br>" + categoryName + ": " + d.source.nameY + " \u21FE " + d.target.nameY;
              info += "<br>" + valueName + ": " + formatNumber(d.value, thousandsSeparator, ",.0f");
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
              tooltipFormat.forEach(function(line){
                if (line === "%event") {
                  info += "<br>% of '" + d.nameX + "': " + formatNumber("" + (d.value/d.valueX), thousandsSeparator, ",.1%");
                } else if (line === "%category") {
                  info += "<br>% of '" + d.nameY + "': " + formatNumber("" + (d.value/d.valueY), thousandsSeparator, ",.1%");
                } else if (line === "%prevCategory") {
                  info += "<br>% of previous '" + d.nameY + "': " + formatNumber("" + (d.value/d.valueYPrev), thousandsSeparator, ",.1%");
                } else if (line === "%firstCategory") {
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
              return d3.select(".labelOnOff").node().checked ? "block" : "none";})
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
            transitionToSingle(sankeyF.node(), d3.transition().duration(0));
          }

          if (typeof transitionX !== "undefined") {
            d3.selectAll("g.axis.bottom > g.tick").on("click", function(){
              if (visMode === SINGLE) {
                d3.select(".nodeScaling").node().disabled = true;
                d3.select(".labelOnOff").node().checked = false;
                updateNodeLabels();
                d3.select(".labelOnOff").node().disabled = true;
                let nameX = d3.select(this).classed("zoomed", true).datum();
                transitionXaxis(transitionX, nameX, nodeInfos);
                d3.event.stopPropagation();
                visMode = ZOOM;
              } 
            });            
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
          allGraphs = constructSankeyFromCSV(file); // main data structure build from csv file           
          createChart(selection);
        });       
      });
    } 
    else {
      file = d3.csvParse(d3.select("pre#data").text());
      nodeFile = d3.csvParse(d3.select("pre#dataNodes").text());
      if (nodeFile.length === 0) {
        var a;
        nodeFile = a; // set to undefined
      }
      if (debugOn) {
        console.log("file: ");
        console.log(file);
        console.log("nodeFile: ");
        console.log(nodeFile);        
      }
      allGraphs = constructSankeyFromCSV(file); // main data structure build from csv file
      createChart(selection);
    }
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
    } else if (_file.columns.length === 7)  { // two additional dimensions
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
            "value": +d[columns[0]] });    

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
