import * as d3 from "d3";

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

export function addTransitionX(svg, transitionX){
  console.log("clicked on axis" + transitionX);
  const trans = d3.transition().duration(1000);
  const myFrame = d3.select("g.sankeyFrame.single");
  const frameY = myFrame.node().getBBox().height;
  console.log("frame (670): " + frameY);

  // hide links
  myFrame.select("g.links")
    .transition(trans)
    .style("opacity", 0);

  // hide not selected nodes
  let hideNodes = myFrame.selectAll("g.node").filter((d) => d.nameX !== "meetup3");
  hideNodes.transition(trans)
        .style("opacity", 0);

  // hide y axis
  d3.select("g.axis.left")
    .transition(trans)
    .style("opacity", 0);

  // transition selected nodes
  let updateNodes = myFrame.selectAll("g.node").filter((d) => d.nameX === "meetup3");
  const sumOfValues = updateNodes.filter((d, i) => i === 0).datum().valueX; 
  const rectY = d3.scaleLinear().domain([0, sumOfValues]).range([0,frameY]);

  updateNodes.select("rect")
    .transition(trans)
    .attr("height", (d) => rectY(d.value));

  // replace with each()...
    /*.data(["meetup3"], (d) => d.nameX);

  updateNodes
    .transition(trans)
    .style("transform", function(){
      let trans = d3.select(this).style("transform");
      return  trans + " " + "scale(1,2)";
    });

  updateNodes.exit()
    .transition(trans)
    .style("opacity", 0);
    */

  // d3.selectAll("rect.sankeyNode." + "nxmeetup3").style("opacity", 1);
  // d3.selectAll("g.sankeySeq > g > rect").filter((d,i) => d3.select(this). )
}