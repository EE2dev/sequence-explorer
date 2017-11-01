import * as d3 from "d3";

// compute values for transition labels
export function getPositionData(_elementsToLabel, _catSubset, height, width) {
  var labelSubset = [];
  var pData = {};

  _catSubset.forEach(function(d) { pData[d] = {}; });
  for (var key in _elementsToLabel) {
    if (_elementsToLabel.hasOwnProperty(key)) {
      labelSubset.push(_elementsToLabel[key].yDest);
    }
  }
     
  pData.rect = getLabelSize(_elementsToLabel, 16);
  var xPos = getXPositions(_elementsToLabel, pData.rect, width);

    // rest is cat specific
  pData.yPos = getYPositions(labelSubset, pData.rect.height, height);

  _catSubset.forEach(function(d,i) {
    pData[d].xLabel = xPos.x;
    pData[d].labelLeft = xPos.labelLeft;
    pData[d].yLabel = pData.yPos[i];
    pData[d].yDest = labelSubset[i];
    pData[d].yTrans = pData[d].yDest - pData[d].yLabel;
    pData[d].value = _elementsToLabel[d].value;
  });
  pData.lineX1 = 0;
  pData.lineY1 = 0;

  function getLabelSize(_elementsToLabel, fontSize) {
    var maxWidth = 0;
    var maxHeight = 0;        

    var dummy = d3.select("svg")
            .append("g")
            .attr("class", "dummy l1")
            .style("opacity", 0)
            .selectAll("text")
            .data(Object.keys(_elementsToLabel))
            .enter()
            .append("text")
            .style("font-size", fontSize + "px")
            .style("font-family", "sans-serif")
            .text(function(d) { return _elementsToLabel[d].value; });

    dummy.each(function (d) {
      var ele = d3.select(this).node();
      maxWidth = (ele.getBBox().width > maxWidth) ? ele.getBBox().width : maxWidth;
      maxHeight = (ele.getBBox().height > maxHeight) ? ele.getBBox().height : maxHeight;
      pData[d].textWidth = ele.getBBox().width + 18; // 2* (+ 6 (tick length) + 3 (space between tick and text))
    }); 
    d3.selectAll("g.dummy").remove();
        
    return { 
      width: maxWidth + 10, // add space for line 
      height: maxHeight + 10 // add space for better vertical separation
    };
  } 

    // returns object with x position for label transition destination
  function getXPositions(_elementsToLabel, rect) {
    var res = {};
    var ele = _elementsToLabel[Object.keys(_elementsToLabel)[0]]; // pick first element assuming x values are the same

    if (rect.width < ele.xLeft) {
      res.x = ele.xLeft;
      res.labelLeft = true;
    } else {
      res.x = ele.xRight;
      res.labelLeft = false;
    }
    return res;
  } 

    // returns array of y positions for label transition destination without overlaps
  function getYPositions(data, rectHeight, height) { 
    var dataObject = createObject(data);
    dataObject = adjustBottoms(dataObject);
    var positionEnd = trimObject(dataObject);

    if (positionEnd[positionEnd.length-1] < rectHeight/2) { // second pass if out of range
      dataObject = adjustTops(dataObject);
      positionEnd = trimObject(dataObject);
    }

    function createObject(data) {
            // setup data structure with rectangles from bottom to the top
      var dataObject = [];
      var obj = {top: height, bottom: height + rectHeight}; // add dummy rect for lower bound
            
      dataObject.push(obj);
      data.forEach(function(d){
        obj = {top: d - rectHeight/2, bottom: d + rectHeight/2};
        dataObject.push(obj);
      });
      obj = {top: 0 - rectHeight, bottom: 0}; // add dummy rect for upper bound
      dataObject.push(obj);
        
      return dataObject;
    }
        
    function trimObject(dataObject) { // convert back to original array of values, also remove dummies
      var data3 = [];
      dataObject.forEach(function(d,i){
        if (!(i === 0 || i === dataObject.length-1)) {
          data3.push(d.top + rectHeight/2);
        }
      });
      return data3;
    }
        
    function adjustBottoms(dataObject){
      dataObject.forEach(function(d,i){
        if (!(i === 0 || i === dataObject.length-1)) {
          var diff = dataObject[i-1].top - d.bottom;
          if (diff < 0) { // move rect up   
            d.top += diff;
            d.bottom += diff;
          }
        }
      });
      return dataObject;
    }
        
    function adjustTops(dataObject){
      for (var i = dataObject.length; i-- > 0; ){
        if (!(i === 0 || i === dataObject.length-1)) {
          var diff = dataObject[i+1].bottom - dataObject[i].top;
          if (diff > 0) { // move rect down
            dataObject[i].top += diff;
            dataObject[i].bottom += diff;
          }
        }
      }
      return dataObject;
    }
    return positionEnd;
  }
  return pData;
}