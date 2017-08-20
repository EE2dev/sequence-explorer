import * as d3 from "d3";
import {getTranslation} from "./helper";

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
  console.log("clicked on axis" + transitionX);
  const trans = d3.transition().duration(1000);
  const myFrame = d3.select("g.sankeyFrame.single");
  const frameY = myFrame.select(".coverSankeySeq").node().getBBox().height;

  // hide links
  myFrame.select("g.links")
    .transition(trans)
    .style("opacity", 0)
    .on("end",  function(){ d3.select(this).classed("hide", true); return;});

  // hide not selected nodes
  let hideNodes = myFrame.selectAll("g.node").filter((d) => d.nameX !== nameX);
  hideNodes.transition(trans)
        .style("opacity", 0)
        .on("end",  function(){ d3.select(this).classed("hide", true); return;});

  // in case some categories are excluded for transition
  let hideNodes2 = myFrame.selectAll("g.node")
    .filter((d) => d.nameX === nameX)
    .filter((d) => transitionX().indexOf(d.nameY) === -1);
  hideNodes2.transition(trans)
        .style("opacity", 0)
        .on("end",  function(){ d3.select(this).classed("hide", true); return;});      

  // hide y axis
  d3.select("g.axis.left")
    .transition(trans)
    .style("opacity", 0)
    .on("end",  function(){ 
      d3.select(this).classed("hide", true); 
      return;
    });

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

/*
  const sumOfValues = updateNodes.filter(function(d, i) {
    arrOfValues.forEach(function(element) {
      if (element.name === d.nameY) {
        element.value = d.value;
      }
    });
    return i === 0;
  }).datum().valueX;
  */

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
      /*
      console.log("name: " + d.name);
      console.log("transX: " + transX);
      console.log("transY: " + transY);
      console.log(" ");
      */
      return "translate (" + transX + "," + transY + ")";
    });

  // transition regular nodes
  updateNodes.select("rect.sankeyNode")
    .transition(trans)
    .attr("height", (d) => rectY(d.value));

  // transition node infos
  let updateNodeInfos = updateNodes.select("rect.sankeyNodeInfo");
  updateNodeInfos
    .classed("zoomed", true)
    .each(function(d) {
      nodeInfos.nodeInfoKeys.forEach( function(key) {
        d.nodeInfos[key + "_transY"] = rectY(d.value - +d.nodeInfos[key]);
        d.nodeInfos[key + "_transHeight"] = rectY(+d.nodeInfos[key]);
      /*
      d.nodeInfos[key + "_transY"] = (key === nodeInfos.nodeInfoNone) 
        ? rectY(d.value) : rectY(d.value - +d.nodeInfos[key]);

      d.nodeInfos[key + "_transHeight"] = (key === nodeInfos.nodeInfoNone) 
        ? 0 : rectY(+d.nodeInfos[key]);
      */
      });
    });

  updateNodeInfos
    .transition(trans)
    // .attr("height", (d) => rectY(d.value))
    .attr("y", d => d.nodeInfos[nodeInfos.nodeInfoKey + "_transY"])
    .attr("height", d => d.nodeInfos[nodeInfos.nodeInfoKey + "_transHeight"]);
/*
    .attr("y", function(d) {
      if (nodeInfoKey === nodeInfoNone) { return rectY(d.value); }
      else {
       // return rectY(d.dy - d.nodeInfos[nodeInfoKey + "_dy"]);
        return rectY(d.value - d.nodeInfos[nodeInfoKey]);
      }
    })
    .attr("height", function(d) { 
      if (nodeInfoKey === nodeInfoNone) { return 0; }
     // else {return rectY(d.nodeInfos[nodeInfoKey + "_dy"]); }
      else {return rectY(d.nodeInfos[nodeInfoKey]); }
    });
    */

}

export function transitionXaxisBack(nameX){
  const myFrame = d3.select("g.sankeyFrame.single");
  const trans = d3.transition().duration(1000);

  // show links
  myFrame.select("g.links")
    .classed("hide", false)
    .transition(trans)
    .style("opacity", 1);

  // show not selected nodes
  let hideNodes = myFrame.selectAll("g.node").filter((d) => d.nameX !== nameX);
  hideNodes.classed("hide", false)
        .transition(trans)
        .style("opacity", 1);

  // show y axis
  d3.select("g.axis.left")
    .classed("hide", false)
    .transition(trans)
    .style("opacity", 1);

  // translate nodes to original position
  let updateNodes = myFrame.selectAll("g.node").filter((d) => d.nameX === nameX);
  updateNodes.transition(trans)
    .attr("transform", function(d){
      return "translate (" + d.x + "," + d.y + ")";
    });

  // rescale height nodes
  updateNodes.select("rect")
    .transition(trans)
    .attr("height", (d) => d.dy);
}