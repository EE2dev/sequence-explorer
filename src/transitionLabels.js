import * as d3 from "d3";
import {getTranslation} from "./helper";

// transition labels
export function transitionAxis(_pData, _axis, catSubset, _trans) {
  var ele = _pData[Object.keys(_pData)[0]]; // pick first element since x values are the same
  var translateX = ele.xLabel; // x value of element - x translation of scale

  var sel = _axis.selectAll("g.tick").data(catSubset, function(d){ return d;})
        .each(function(d){
            // compute y transform
          var yOffset = d3.select(this).attr("transform");
          var transYOffset = getTranslation(yOffset)[1] + 0.5; // 0.5 translate line
          var translateY = _pData[d].yLabel - transYOffset;
          d3.select(this).selectAll("text")
                .transition(_trans)
                .attr("transform", function(d) { 
                  var translateXNew = (_pData[d].labelLeft) ? translateX : translateX + _pData[d].textWidth;
                  return "translate(" + translateXNew + ", " + translateY + ")";})
                .style("font-size", "16px")
                .attr("dy", "0.35em") // slight transition from 0.32 otherwise animation ends with jump
                .on("end", function (){
                  d3.select(this).text(function(d) {return _pData[d].value;});  
                });
            
          d3.select(this).selectAll("line")   
                .transition(_trans)
                .attr("x1", 0)
                .attr("y1", function(d){ return 0.5 + _pData[d].yTrans;})
                .attr("x2", function(){ return ele.labelLeft ? -6 : 6;})
                .attr("transform", function() {return "translate(" + translateX + ", " + translateY + ")";});
        });

  sel.exit()
        .transition(_trans)
        .style("opacity", 0);

  _axis.selectAll("path.domain")
        .transition(_trans)
        .style("opacity", 0);
}

// transition back
export function transitionBack(_axis, catSubset, _trans) {
  var sel = _axis.selectAll("g.tick").data(catSubset, function(d){ return d;})
        .each(function(){
          d3.select(this).selectAll("text")
                .text(function(d) {return d;})
                .transition(_trans)
                .attr("transform", "translate(0, 0)")
                .style("font-size", "10px")
                .attr("dy", "0.32em");
            
          d3.select(this).selectAll("line")   
                .transition(_trans)
                .attr("x1", 0)
                .attr("y1", 0.5)
                .attr("x2", -6)
                .attr("y2", 0.5)
                .attr("transform", "translate(0,0)");
        });

  sel.exit()
        .transition(_trans)
        .style("opacity", 1);

  _axis.selectAll("path.domain")
        .transition(_trans)
        .style("opacity", 1);    
}
