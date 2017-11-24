import * as d3 from "d3";

// start Particles - idea from https://bl.ocks.org/emeeks/21f99959d48dd0d0c746

export function particles() {
  let publicAPI = function(){};
  let allPaths = [];
  let cw; // canvas width
  let ch; // canvas height
  let frequencyScale;
  let myTimer = {};
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
    
    if (d3.select("div.sankeyChart").selectAll("canvas").size() === 0) {
      initializeCanvas(_canvasTL, _linkMax, _particlesMin, _particlesMax, _particlesSpeed);
    } 

    let pathExists = false;
    allPaths.forEach(function(d){
      if (d.pathName === _pathName) {pathExists = true;}
    });
    
    if (!pathExists){ initializeAllPaths(_svgPaths, _pathName, _myPath, _sequenceStart, _linkValue);}
    return publicAPI;    
  };

  publicAPI.start = function (){
    if (Object.keys(myTimer).length === 0) {myTimer = d3.timer(tick);}
    return publicAPI;
  };
  
  publicAPI.stop = function (_pathName){
    if (typeof _pathName === "undefined") { stopParticles();}
    
    let pathExists = false;
    let index = -1;

    allPaths.forEach(function(d, i){
      if (d.pathName === _pathName) {pathExists = true; index = i;}
    });

    if (pathExists) {
      if (allPaths.length === 1) { stopParticles();} // last path
      else {
        allPaths.remove = index;
      }
    }
    return publicAPI;
  };

  function stopParticles() {
    myTimer.stop(); 
    myTimer = {};
    allPaths = [];
    d3.select("div.sankeyChart canvas").remove();
  }

  function initializeCanvas(_canvasTranslate, _linkMax, _particlesMin, _particlesMax, _particlesSpeed) { 
    particlesSpeed = _particlesSpeed;
    allPaths.remove = -1;
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
          myLink.sourceX = link.source.nameX;
          myLink.sourceY = link.source.nameY;
          myLink.svgPath = svgPath;
          myLinks.push(myLink);
        } 
      });     
    });
    let thisPath = {};
    thisPath["pathName"] = pathName;
    thisPath["sequenceStart"] = _sequenceStart;
    thisPath["links"] = myLinks;
    thisPath["particles"] = [];

    allPaths.push(thisPath);
  }

  function tick(elapsed) {
    if (allPaths.remove !== -1) {
      allPaths.splice(allPaths.remove,1); 
      allPaths.remove = -1;
    }

    
    allPaths.forEach(function(_path){
      _path["particles"].forEach(function (d) {
        if (d.current >= d.path.getTotalLength() ){
          _path["links"]
            .filter(l => d.path.__data__.target.nameX === l.sourceX && d.path.__data__.target.nameY === l.sourceY)
            .forEach(function (l) {
              d.link = l;
              d.time = elapsed;
              d.offset = d.offsetFactor * l.dy;
              d.path = l.svgPath;
              d.current = 0;
            });
        } // end if       
      });

      _path["particles"] = _path["particles"].filter(function(d){return d.current < d.path.getTotalLength();});

      _path["links"]
      .filter(d => _path["sequenceStart"] === d.sourceX) 
      .forEach(function (d) {
        let factor =  (Math.random() - .5);
        var offset = factor * d.dy;
        if (Math.random() < d.freq) {
          _path["particles"].push({link: d, time: elapsed, offset: offset, offsetFactor: factor, path: d.svgPath});
        }
      });
    });

    particleEdgeCanvasPath(elapsed);
  }

  function particleEdgeCanvasPath(elapsed) {

    context.clearRect(0,0,cw,ch);
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