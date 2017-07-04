import * as d3 from "d3";  

// helper function for calculating the position of the tooltip for node and node info
export function positionTooltipNode (tooltip) {
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
}

// helper function for getting the transform attributes
// from http://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4

export function getTranslation(transform) { 
// Create a dummy g for calculation purposes only. This will never
// be appended to the DOM and will be discarded once this function 
// returns.
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

// Set the transform attribute to the provided string value.
  g.setAttributeNS(null, "transform", transform);

// consolidate the SVGTransformList containing all transformations
// to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
// its SVGMatrix. 
  var matrix = g.transform.baseVal.consolidate().matrix;

// As per definition values e and f are the ones for the translation.
  return [matrix.e, matrix.f];
}

// helper function to apply thousandSeparator
export function formatNumber(str, thousandsSeparator) {
  var format = d3.format(",.0f");
  if (thousandsSeparator === ".") { // German convention
    if (+str % 1 !== 0) {
      return str.split(".").join(",");
    }
    else {
      var newStr = format(str).split(",").join(".");
      return newStr;
    }
  }
  else {    // US convention
    if (+str % 1 !== 0) { 
      return str;
    }
    else {        
      return format(str);
    }
  }
}  

// helper function to sort row and col dimension ascending or as specified
export function orderDimension (dim) {
  if (typeof dim === "undefined") {
    return d3.ascending;
  } 
  else {
    return function(a, b) { return dim.indexOf(a) - dim.indexOf(b);};
  }
}
