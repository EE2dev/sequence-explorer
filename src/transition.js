import * as d3 from "d3";
import {getTranslation, formatNumber} from "./helper";

export function transitionToSingle(clickedElement, _trans) {
  var trans = (typeof _trans !== "undefined") ? _trans : d3.transition().duration(1000);
    
  d3.selectAll("g.sankeyFrame")
    .each(function() {
      if (this === clickedElement) {
        console.log("clicked");

        d3.select(this) // set class
            .classed("multiples", false)
            .classed("single", true);

        d3.select(this) // transition frame
            .transition(trans)
            .attr("transform", "translate(0, 0)");
            
        d3.select(this).selectAll("g.pTop") // transition top padding
            .transition(trans)
            .attr("transform", function(d) {return d.single;});
          
        d3.select(this).selectAll("text.col.multiples") // hide col title on top
            .transition(trans)
            .style("opacity", 0);
            
        d3.select(this).selectAll("text.col.single") // display row + col title on top
            .transition(trans)
            .style("opacity", 1); 
            
        d3.select(this).selectAll("text.nodeLabel") // display nodeLabels
            .transition(trans)
            .style("opacity", 1); 
          
        d3.select(this).selectAll("g.pLeft") // hide left padding g
            .transition(trans)
            .style("opacity", 0); 
          
        d3.select(this).selectAll(".sankeyNode,.sankeyNodeInfo") // display edge of rectangles
            .transition(trans)
            .style("stroke-width", "1px");          
          
        d3.select(this).selectAll("g.sankeySeq") // transition graph 
            .transition(trans)
            .attr("transform", function(d) {return d.single;});
            
        d3.selectAll(".axis") // show axes for sequence and categories
            .transition().delay(800)
            .style("opacity", 1); 

        d3.selectAll(".coverSankeySeq") // hide surrounding rectangle
            .transition(trans)
            .style("opacity", 0);                         

      } else {
        console.log("not clicked");

        d3.select(this) // set class
            .classed("multiples", false);

        d3.select(this)
              .transition(trans)
              .attr("transform", function(d) {return d.single;})
              .style("opacity", 0);
              
        d3.select(this).selectAll(".sankeyNode,.sankeyNodeInfo") // display edge of rectangles
              .transition(trans)
              .style("stroke-width", "1px");  
      }
    });
  return false;
}
  
export function transitionToMultiples(clickedElement) {
  var trans = d3.transition()
      .duration(1000);
      
  d3.selectAll("g.sankeyFrame")
    .classed("multiples", true)
    .each(function() {
      if (this === clickedElement) {
        console.log("clicked");

        d3.select(this) // set class
            .classed("single", false);

        d3.select(this)
            .transition(trans)
            .attr("transform", function(d) { return d.multiples;});

        d3.select(this).selectAll("g.pTop") // transition top padding
            .transition(trans)
            .attr("transform", function(d) {return d.multiples;});  
            
        d3.select(this).selectAll("text.col.multiples") // display col title on top
            .transition(trans)
            .style("opacity", 1);
            
        d3.select(this).selectAll("text.col.single") // hide row + col title on top
            .transition(trans)
            .style("opacity", 0);           

        d3.select(this).selectAll("text.nodeLabel") // hide nodeLabels
            .transition(trans)
            .style("opacity", 0); 
            
        d3.select(this).selectAll("g.pLeft") // display left padding g
            .transition(trans)
            .style("opacity", 1); 
          
        d3.select(this).selectAll(".sankeyNode,.sankeyNodeInfo") // hide edge of rectangles
            .transition(trans)
            .style("stroke-width", "0px");           
          
        d3.select(this).selectAll("g.sankeySeq") // transition graph 
            .transition(trans)
            .attr("transform", function(d) {return d.multiples;});  

        d3.selectAll(".axis")
            .transition(trans)
            .style("opacity", 0);
            
        d3.selectAll(".coverSankeySeq")
            .transition(trans)
            .style("opacity", 1);     
                      
      } else {
        d3.select(this)
            .transition(trans)
            .attr("transform", function(d) {return d.multiples;})
            .style("opacity", 1);
            
        d3.select(this).selectAll(".sankeyNode,.sankeyNodeInfo") // hide edge of rectangles
            .transition(trans)
            .style("stroke-width", "0px");
      }
    });   
  return true;
}

export function transitionXaxis(transitionX, nameX, nodeInfos){
  const trans = d3.transition().duration(1000);
  const myFrame = d3.select("g.sankeyFrame.single");
  const frameY = myFrame.select(".coverSankeySeq").node().getBBox().height;

  hideSelection(myFrame.selectAll("g.links"), trans); // hide links  
  hideSelection(myFrame.selectAll("g.node").filter((d) => d.nameX !== nameX)
    ,trans); // hide not selected nodes
  hideSelection(myFrame.selectAll("g.node")
      .filter((d) => d.nameX === nameX)
      .filter((d) => transitionX().indexOf(d.nameY) === -1)
    ,trans); // in case some categories are excluded for transition
  hideSelection(d3.select("g.axis.left"), trans);   // hide y axis

  // calculate position for nodes
  let updateNodes = myFrame.selectAll("g.node")
    .filter(d => d.nameX === nameX)
    .filter(d => transitionX().indexOf(d.nameY) !== -1);
  let newValue = 0;
  let tempValue = 0;
  let arrOfValues = [];
  // initialize arrOfValues with selected categories 
  transitionX().forEach(function(element) {
    arrOfValues.push({name: element, value: 0});
  });

  // add individual values to categories in arrOfValues
  let sumOfValues = 0;
  updateNodes.each(function(d) {
    arrOfValues.forEach(function(element) {
      if (element.name === d.nameY) {
        element.value = d.value;
        sumOfValues += d.value;
      }
    });
  });

  // update values to reflect cumulative values
  arrOfValues.forEach(function(element){
    tempValue = element.value;
    element.value = newValue;
    newValue += tempValue;
  });

  // set up scale to map cumulative values to position on SVG
  const rectY = d3.scaleLinear().domain([0, sumOfValues]).range([0, frameY - 10]);

  updateNodes.transition(trans)
    .attr("transform", function(d){
      const transX = getTranslation(d3.select(this).attr("transform"))[0];
      let transY = 0;
      arrOfValues.forEach(function(element) {
        if (element.name === d.nameY) {
          transY = frameY - rectY(element.value + d.value);
        }
      });
      return "translate (" + transX + "," + transY + ")";
    });

  // transition regular nodes
  updateNodes.selectAll("rect.sankeyNode")
    .transition(trans)
    .attr("height", (d) => rectY(d.value));

  // transition node infos
  let updateNodeInfos = updateNodes.selectAll("rect.sankeyNodeInfo");
  updateNodeInfos
    .classed("zoomed", true)
    .each(function(d) {
      nodeInfos.nodeInfoKeys.forEach( function(key) {
        d.nodeInfos[key + "_transY"] = rectY(d.value - +d.nodeInfos[key]);
        d.nodeInfos[key + "_transHeight"] = rectY(+d.nodeInfos[key]);
      });
    });

  updateNodeInfos
    .transition(trans)
    .attr("y", d => d.nodeInfos[nodeInfos.nodeInfoKey + "_transY"])
    .attr("height", d => d.nodeInfos[nodeInfos.nodeInfoKey + "_transHeight"]);
}

export function transitionXaxisBack(nameX, nodeInfos){
  const myFrame = d3.select("g.sankeyFrame.single");
  const trans = d3.transition().duration(1000);
    
  showSelection(myFrame.selectAll("g.links"), trans); // show links  
  showSelection(myFrame.selectAll("g.node") ,trans); // show all nodes
  showSelection(d3.select("g.axis.left"), trans);   // show y axis

  // translate zoom transitioned nodes to original position
  let updateNodes = myFrame.selectAll("g.node")
    .filter(function(){
      return !d3.select(this).classed("hide");
    });

  updateNodes.transition(trans)
    .attr("transform", function(d){
      return "translate (" + d.x + "," + d.y + ")";
    });

  // rescale height nodes
  updateNodes.selectAll("rect.sankeyNode")
    .transition(trans)
    .attr("height", d => d.dy);

  // rescale node infos
  myFrame.selectAll("rect.sankeyNodeInfo")
    .classed("zoomed", false)
    .transition(trans)
    .attr("y", d => d.dy - d.nodeInfos[nodeInfos.nodeInfoKey + "_dy"])
    .attr("height", d => d.nodeInfos[nodeInfos.nodeInfoKey + "_dy"]);
}

function hideSelection(sel, trans) {
  sel.transition(trans)
    .style("opacity", 0)
    .on("end",  function(){ d3.select(this).classed("hide", true); return;});
}

function showSelection(sel, trans) {
  sel.classed("hide", false)
    .transition(trans)
    .style("opacity", 1);
}

export function transitionYaxis(transitionY, nameY, sequence, thousandsSeparator, percentage){
  const trans = d3.transition().duration(1000);
  const myFrame = d3.select("g.sankeyFrame.single");
  const dx = d3.select("g.sankeyFrame.single rect.sankeyNode").attr("width") / 2; // position adjustment for text label
  const dy = -5; // height adjustment for text label

  hideSelection(myFrame.selectAll("g.links"), trans); // hide links  
  hideSelection(myFrame.selectAll("g.node").filter((d) => d.nameY !== nameY)
    ,trans); // hide not selected nodes

  let denominator = {};
  sequence.forEach(seqEvent => {denominator[seqEvent] = 0;});
  myFrame.selectAll("g.node")
    .filter(d => transitionY().indexOf(d.nameY) !== -1)
    .each(d => denominator[d.nameX] += d.value);
  
  let line = percentage;
  let ccTest = true;
  function getPercentage(d){
    let label;
    if (line === "%event") {
      if (ccTest) {
        label = formatNumber("" + (d.value/d.valueX), thousandsSeparator, ",.1%");
      } else {
        label = formatNumber("" + (d.value/d.valueXCorr), thousandsSeparator, ",.1%");
      }
    } else if (line === "%category") {
      label = formatNumber("" + (d.value/d.valueY), thousandsSeparator, ",.1%");
    } else if (line === "%prevCategory") {
      label = formatNumber("" + (d.value/d.valueYPrev), thousandsSeparator, ",.1%");
    } else if (line === "%firstCategory") {
      label = formatNumber("" + (d.value/d.valueYFirst), thousandsSeparator, ",.1%");
    }
    return label;
  }

  myFrame.selectAll("g.node")
    .filter(d => d.nameY === nameY)
    .append("text")
    .attr("class", "percentageLabel")
    .attr("x" , dx+ "px")
    .attr("y", dy + "px")
    // .text( d => formatNumber("" + (d.value / denominator[d.nameX]), thousandsSeparator, ",.1%"))
    .text(getPercentage)
    .transition(trans)
    .style("opacity", 1);
}

export function transitionYaxisBack(){
  const myFrame = d3.select("g.sankeyFrame.single");
  const trans = d3.transition().duration(1000);
    
  showSelection(myFrame.selectAll("g.links"), trans); // show links  
  showSelection(myFrame.selectAll("g.node") ,trans); // show all nodes
  hideSelection(d3.selectAll("text.percentageLabel"), trans); // hide labels
}

