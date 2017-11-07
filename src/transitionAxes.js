import * as d3 from "d3";
import {getTranslation, formatNumber} from "./helper";
import {getPositionData} from "./transitionLabelsInit";
import {transitionAxis, transitionBack} from "./transitionLabels";

export function transitionXaxis(transitionX, nameX, nodeInfos, _thousandsSeparator){
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
  let translateY = {}; 
  let translateYHeight = {}; 
  
  updateNodes.transition(trans)
      .attr("transform", function(d){
        const transX = getTranslation(d3.select(this).attr("transform"))[0];
        let transY = 0;
        arrOfValues.forEach(function(element) {
          if (element.name === d.nameY) {
            transY = frameY - rectY(element.value + d.value);
            translateY[d.nameY] = transY;
            translateYHeight[d.nameY] = rectY(d.value);
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
  
    // initialize variables for label transition
  let xStartElement = getTranslation(updateNodes.attr("transform"))[0];
  let nodeWidth = +updateNodes
      .selectAll("rect")
      .filter((d,i ) => { return i === 0; })
      .attr("width") + 1;    
  let dataSubset = {};
  let tValue = {};
  let catSubsetInit = transitionX();
  let catSubset = []; // reduce catSubsetInit to the node which exist at the x position
  updateNodes.each(function(d) {
    dataSubset[d.nameY] = getTranslation(d3.select(this).attr("transform"))[1];
    tValue[d.nameY] = formatNumber("" + (d.value/d.valueXCorr), _thousandsSeparator, ",.1%");
  });
  
  catSubsetInit.forEach( function(cat){
    updateNodes.filter(d => d.nameY === cat)
      .each(() => catSubset.push(cat));
  });
    
  let axis = d3.selectAll("g.axis.left");
  let width = myFrame.selectAll(".sankeySeq").node().getBBox().width;
  let height = myFrame.selectAll(".sankeySeq").node().getBBox().height;
  
  let elementsToLabel = {};
  catSubset.forEach(function(d,i) {
    elementsToLabel[d] = {
      index: i,
      xLeft: xStartElement,
      xRight: xStartElement + nodeWidth,
      yDest: translateY[d] + translateYHeight[d]/2,
      value: tValue[d] + " " + d
    };
  });  
  let pData = getPositionData(elementsToLabel, catSubset, height, width);
  transitionAxis(pData, axis, catSubset, trans);
}
  
export function transitionXaxisBack(_corrCategories, nameX, nodeInfos){
  const myFrame = d3.select("g.sankeyFrame.single");
  const trans = d3.transition().duration(1000);
      
  let axis = d3.selectAll("g.axis.left");
  let catSubsetInit = _corrCategories();
  let catSubset = []; // reduce catSubsetInit to the nodes which exist at the x position
  let updateNodes = myFrame.selectAll("g.node")
      .filter(function(){ return !d3.select(this).classed("hide");
      });
  
  updateNodes.each(function(d) {
    if (catSubsetInit.indexOf(d.nameY) !== -1) { catSubset.push(d.nameY); }
  });
  transitionBack(axis, catSubset, trans); // show y axis
  
    // translate zoom transitioned nodes to original position
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
  
  showSelection(myFrame.selectAll("g.links"), trans); // show links  
  showSelection(myFrame.selectAll("g.node") ,trans); // show all nodes
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
  
export function transitionYaxis(nameY, thousandsSeparator, percentage, firstSequenceEle){
  const trans = d3.transition().duration(1000);
  const myFrame = d3.select("g.sankeyFrame.single");
  const dx = d3.select("g.sankeyFrame.single rect.sankeyNode").attr("width") / 2; // position adjustment for text label
  const dy = -5; // height adjustment for text label
  
  hideSelection(myFrame.selectAll("g.links"), trans); // hide links  
  hideSelection(myFrame.selectAll("g.node").filter((d) => d.nameY !== nameY)
      ,trans); // hide not selected nodes
   
  function getPercentage(d){
    let label;
    if (percentage === "%sameTime") {
      label = formatNumber("" + (d.value/d.valueXCorr), thousandsSeparator, ",.1%");
    } else if (percentage === "%sameEvent") {
      label = formatNumber("" + (d.value/d.valueY), thousandsSeparator, ",.1%");
    } else if (percentage === "%prevEvent") {
      label = formatNumber("" + (d.value/d.valueYPrev), thousandsSeparator, ",.1%");
    } else if (percentage === "%firstEvent") {
      label = formatNumber("" + (d.value/d.valueYFirst), thousandsSeparator, ",.1%");
    }
    return label;
  }
  
  myFrame.selectAll("g.node")
      .filter(d => d.nameY === nameY)
      .append("text")
      .attr("class", "percentageLabel")
      .attr("x", function(d) { let x = (firstSequenceEle === d.nameX) ? 2 : dx;
        return x + "px";})
      .attr("y", dy + "px")
      .text(getPercentage)
      .style("text-anchor", function(d) { return firstSequenceEle === d.nameX ? "left" : "middle";})
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