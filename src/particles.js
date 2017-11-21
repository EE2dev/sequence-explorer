import * as d3 from "d3";

// start Particles - idea from https://bl.ocks.org/emeeks/21f99959d48dd0d0c746
          // display paths div
          // tooltip disappeared
          // create copy of links which are path --> links are not permanently changed to show
          // opacity of red ?
          // OK interrupt on click on none
          // svg on top of canvas to allow tooltip
          // particles not on independent paths but the same one flow through 
          // move all to one canvas
          // bug: checking second path leads to updated particle value (freq) on all paths
          // reduce domain of frequencyScale from 1 to 0.5
          // test without web server

export function particles() {
  let publicAPI = function(){};
  let allPaths = [];
  let cw; // canvas width
  let ch; // canvas height
  let frequencyScale;
  let myTimer; // = {};
  let particlesSpeed;
  let pathName;
  let svgPaths;
  let context;
  
  /*
    @args
    _svgPaths: the SVG paths
    _canvasTL: the absolute position of the tol left corner is _canvasTL.x, _canvasTL.y
    _pathName: name of the path
    _myPath: an array of objects containing the source and target positions of each path element
    _sequenceStart: first element of sequence where the path begins
    _linkMax: maximum possible value of any path (for computing proportionally the number of particles)  
    _linkValue: the value of _myPath (for computing proportionally the number of particles) 
    _particlesMin: sets the minimum value for the particle scale which determines the maximum number of particles when compared to a rondom number [0;1]
    _particlesMax: sets the maximum value for the particle scale which determines the maximum number of particles when compared to a rondom number [0;1]
    _particlesSpeed: sets the speed of particles. The default speed is 0.1.
  */ 
  publicAPI.init = function (_svgPaths, _canvasTL, _pathName, _myPath, _sequenceStart, _linkMax,
    _linkValue, _particlesMin, _particlesMax, _particlesSpeed){

    let pathExists = false;
    
    if (d3.select("div.sankeyChart").selectAll("canvas").size() === 0) {
      initializeCanvas(_canvasTL, _linkMax, _particlesMin, _particlesMax, _particlesSpeed);
    } 
    
    allPaths.forEach(function(d){
      if (d.pathName === _pathName) {pathExists = true;}
    });
    
    if (!pathExists){ initializeAllPaths(_svgPaths, _pathName, _myPath, _sequenceStart, _linkValue);}
    return publicAPI;    
  };

  publicAPI.start = function (){
    if (typeof myTimer === "undefined") {myTimer = {}; myTimer[pathName] = d3.timer(tick);}
    // myTimer[pathName] = d3.timer(tick);
    // to do
    console.log("to do - start");
    console.log(myTimer);

    return publicAPI;
  };
  
  publicAPI.stop = function (_pathName, _bDelete){
    if (typeof _pathName !== "undefined") {
      myTimer[_pathName].stop();
      if (_bDelete) { delete myTimer[_pathName]; }
    } else {
      for (var property in myTimer) {
        if (myTimer.hasOwnProperty(property)) {
          myTimer[property].stop();
          if (_bDelete) { delete myTimer[property]; }
        }
      }
    }
    if (Object.keys(myTimer).length === 0) {d3.select("div.sankeyChart canvas").remove();}
    
    // to do
    console.log("to do - start");
    return publicAPI;
  };

  function initializeCanvas(_canvasTranslate, _linkMax, _particlesMin, _particlesMax, _particlesSpeed) { 
    particlesSpeed = _particlesSpeed;
    frequencyScale = d3.scaleLinear().domain([1, _linkMax]).range([_particlesMin, _particlesMax]);
    cw = d3.select("div.sankeyChart svg").attr("width");
    ch = d3.select("div.sankeyChart svg").attr("height");

    d3.select("div.sankeyChart").insert("canvas", ":first-child")
        .attr("width", cw)
        .attr("height", ch)
        .attr("class", "particles");
    
    context = d3.select("canvas").node().getContext("2d");
    context.clearRect(0,0,cw,ch);
    context.translate(_canvasTranslate.x, _canvasTranslate.y);

    d3.selectAll("g.sankeyFrame.single rect.sankeyNode").each(function(d){
      d.color = d3.select(this).style("fill");
      d.alpha = d3.select(this).style("fill-opacity");
    }); 
  }

  function initializeAllPaths(_svgPaths, _pathName, myPath, _sequenceStart, _linkValue){
    let myLink;
    let myLinks = [];
    pathName = _pathName;
    svgPaths = _svgPaths;

    svgPaths.forEach(function (svgPath) {
      let link = d3.select(svgPath).datum();
      myPath.forEach(function(ele){
        if (ele.sx === link.source.nameX
          && ele.sy === link.source.nameY
          && ele.tx === link.target.nameX
          && ele.ty === link.target.nameY) { // this link is part of path
          myLink = {}; 
          myLink.freq = (_linkValue === undefined) ? frequencyScale(link.value) : frequencyScale(_linkValue);
          myLink.dy = link.dy;
          myLink.particleSize = 2.5;
          myLink.particleColor = d3.scaleLinear().domain([0,1]).range([link.source.color, link.target.color]);
          myLink.particleAlpha = d3.scaleLinear().domain([0,1]).range([link.source.alpha, link.target.alpha]);
          myLink.source = {nameX: link.source.nameX};
          myLink.svgPath = svgPath;
          myLinks.push(myLink);
        } 
      });     
    });
    let thisPath = {};
    thisPath["pathName"] = pathName;
    thisPath["startParticles"] = [_sequenceStart];
    thisPath["links"] = myLinks;
    thisPath["particles"] = [];

    allPaths.push(thisPath);
  }

  function tick(elapsed) {

    allPaths.forEach(function(_path){
      _path["particles"] = _path["particles"].filter(function (d) {
        if (d.current >= d.path.getTotalLength() 
          && _path["startParticles"].indexOf(d.path.__data__.target.nameX) === -1){
          _path["startParticles"].push(d.path.__data__.target.nameX);
        }
        return d.current < d.path.getTotalLength();
      });

      _path["links"]
      .filter(d => _path["startParticles"].indexOf(d.source.nameX) !== -1)
      .forEach(function (d) {
        var offset = (Math.random() - .5) * d.dy;
        if (Math.random() < d.freq) {
          var length = d.svgPath.getTotalLength();
          _path["particles"].push({link: d, time: elapsed, offset: offset, path: d.svgPath, length: length, animateTime: length});
        }
      });
    });

    particleEdgeCanvasPath(elapsed);
    
    if (elapsed > 20000) {
     // myTimer.stop();
      console.log("> 20000");
    }
  }

  function particleEdgeCanvasPath(elapsed) {

    context.clearRect(0,0,cw,ch);
    context.fillStyle = "gray";
    context.lineWidth = "1px";

    allPaths.forEach(function(_path){
      let particles = _path["particles"];
      for (var x in particles) {
        var currentTime = elapsed - particles[x].time;
        particles[x].current = currentTime * particlesSpeed;
        var currentPos = particles[x].path.getPointAtLength(particles[x].current);
        var relativePos = particles[x].current/particles[x].path.getTotalLength();

        context.beginPath();
        context.fillStyle = particles[x].link.particleColor(relativePos);
        context.globalAlpha = particles[x].link.particleAlpha(relativePos);
        context.arc(currentPos.x, currentPos.y + particles[x].offset, particles[x].link.particleSize, 0, 2*Math.PI);
        context.fill();
      }
    });
  }  

  return publicAPI;
}