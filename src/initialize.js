import * as d3 from "d3";

// draws axes and returns an Object with properties
// paddingSingle, paddingMultiples, width, height
// for further processing in function createChart()
export function initialize_whp_and_axes(svg, size, margin, categories, sequence, nodeWidth) {
  var width = size[0] - margin.left - margin.right;
  var height = size[1] - margin.bottom - margin.top; 
  var paddingSingle = {left: 0, bottom: 0, right: 0, top: 20};
  var paddingMultiples = {left: 20, bottom: 0, right: 0, top: 20}; // fixed

    // drawing axes - step 1: determine size of sankey
  var axisL = svg.append("g")
      .attr("class", "dummy d1")
      .style("opacity", 0)
      .call(d3.axisLeft(d3.scalePoint().domain(categories)));

  var axisB = svg.append("g")
      .attr("class", "dummy d2")
      .style("opacity", 0)
      .call(d3.axisBottom(d3.scalePoint().domain(sequence)));

  var lengthOfLastEvent = svg.select("g.dummy.d2 g.tick:last-child text"); // text which can extend the width of the x axis

  paddingSingle.left = axisL.node().getBBox().width;
  paddingSingle.bottom = axisB.node().getBBox().height;
  var extendBAxis = lengthOfLastEvent.node().getBBox().width/2;

    // update width and height for sankeyG
  width = width - paddingSingle.left - extendBAxis - 7; // subtracting 7px for centered percentage text on top of nodes
  height = height - paddingSingle.bottom - paddingMultiples.top - 2;
        
  svg.selectAll("g.dummy").remove();

  var yScale = d3.scalePoint()
      .domain(categories) 
      .range([height, (height / categories.length)]); 
  var axisLeft = d3.axisLeft(yScale);
  var axisSelection = svg.append("g")
      .attr("class", "axis left")
      .style("opacity", 0)
      .call(axisLeft);
      
    // drawing axes - step 2: calculate paddingSingle.Left  
  paddingSingle.left = axisSelection.node().getBBox().width;
  axisSelection.attr("transform", "translate(" + (paddingSingle.left - 1.5) + ", " + paddingSingle.top + ")");
    
    // adjust axis text
  svg.selectAll("g.axis.left text").attr("dy","");

  var xScale = d3.scalePoint()
      .domain(sequence)
      .range([0, width - nodeWidth]); // last node starts at end of domain
  var axisBottom = d3.axisBottom(xScale);
  axisSelection = svg.append("g")
      .attr("class", "axis bottom")
      .style("opacity", 0)
      .call(axisBottom);
    // drawing axes: step 3: calculate paddingSingle.bottom  
  paddingSingle.bottom = axisSelection.node().getBBox().height;
  axisSelection.attr("transform", "translate(" + paddingSingle.left + ", " + (height + paddingMultiples.top) + ")");

    // move text of axisBottom:
    // d3.select("g.axis.bottom").selectAll("text").attr("text-anchor", "start");

  var result = {};
  result.paddingSingle = paddingSingle;
  result.paddingMultiples = paddingMultiples;
  result.width = width;
  result.height = height;
  var particleStart = {};
  particleStart.x = margin.left + paddingSingle.left;
  particleStart.y = margin.top + paddingSingle.top;
  result.particleStart = particleStart;

  svg.selectAll("text").classed("unselect", true);
    
  return result;
}
  
// draws titles, axes around the sankeyGraph
// for single graph and small multiples
export function initializeFrame(selection, props, allGraphs, colIndex, rowIndex) {
  var width = props.width;
  var height = props.height;
  var padding = props.paddingMultiples;
    
  var tx = colIndex * width / allGraphs.cols;
  var ty = rowIndex * height / allGraphs.rows;
  var sx = (1 / allGraphs.cols * width - padding.left) / width;
  var sy = (1 / allGraphs.rows * height - padding.top) / height;
  if (sx >= sy) { sx = sy;} else { sy = sx;} // make multiples proportional to full sized chart
    
  var transformString = {};   
  transformString.sankeyFrame = {};
  transformString.sankeyFrame.single = "translate(" + (tx + width/2*sx) + ", " + (ty + height/2*sy) + ") scale(0.3)"; 
  transformString.sankeyFrame.multiples = "translate(" + tx + ", " + ty + ") "; 
    
  transformString.sankeySeq = {};
  transformString.sankeySeq.single = "translate(" + (props.paddingSingle.left) + ", 20)"; 
  transformString.sankeySeq.multiples = "translate(" + padding.left + ", " + padding.top + ") " + "scale(" + sx + ", " + sy + ")";

  transformString.pTop = {};
  transformString.pTop.single = "translate(" + (padding.left + width / 2) + ", " + (padding.top - 3) + ")"; 
  transformString.pTop.multiples = "translate(" + (padding.left + width / 2 * sx) + ", " + (padding.top - 3) + ")";
      
  transformString.pLeft = {};
  transformString.pLeft.single = "translate(" + (padding.left - 3) + ", " + (padding.top + height / 2) + ")"; 
  transformString.pLeft.multiples = "translate(" + (padding.left - 3) + ", " + (padding.top + height / 2 * sy) + ")";  

  return transformString;
}
  