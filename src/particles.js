import * as d3 from "d3";

// start Particles - idea from https://bl.ocks.org/emeeks/21f99959d48dd0d0c746
          // to do extend for multiples
          // display paths div
          // OK translate dynamically
          // OK calc size of canvas dynamically
          // OK adjust colors dynamically
          // OK to do width + height
          // tooltip disappeared
          // create copy of links which are path --> links are not permanently changed to show
          // opacity of red ?
          // OK interrupt on click on none
          // svg on top of canvas to allow tooltip
          // particles not on independent paths but the same one flow through 
          // allow paths with multiple links?
          // move all to one canvas
          // bug: checking second path leads to updated particle value (freq) on all paths
          // reduce domain of frequencyScale from 1 to 0.5
          // add particle call not just for 2 add dimension but for 1 + 0 dims

export function initializeParticles(_graph, _particleStart, _pathName) {  
  let cw = d3.select("div.sankeyChart svg").attr("width");
  let ch = d3.select("div.sankeyChart svg").attr("height");

  d3.select("div.sankeyChart").insert("canvas", ":first-child")
    .attr("width", cw).attr("height", ch).classed("particles " + _pathName, true);
  
  let context = d3.select("canvas").node().getContext("2d");
  context.clearRect(0,0,cw,ch);
  context.translate(_particleStart.x, _particleStart.y);

  d3.selectAll("g.sankeyFrame.single rect.sankeyNode").each(function(d){
    d.color = d3.select(this).style("fill");
    d.alpha = d3.select(this).style("fill-opacity");
  });  
}

export function drawParticles(_graph, _pathName, myPath, _sequenceStart, _linkMax, _linkValue){
  var startParticles = [_sequenceStart];
  var particles = [];
  let cw = d3.select("div.sankeyChart svg").attr("width");
  let ch = d3.select("div.sankeyChart svg").attr("height");
  var sp;

  // var linkExtent = d3.extent(_graph.links, function (d) {return d.value;});
  // var frequencyScale = d3.scaleLinear().domain(linkExtent).range([0.05,1]);
  var frequencyScale = d3.scaleLinear().domain([1, _linkMax]).range([0.05,1]);

  // console.log("links:");
  _graph.links.forEach(function (link) {
    // link.freq = frequencyScale(link.value);
    link.freq = (_linkValue === undefined) ? frequencyScale(link.value) : frequencyScale(_linkValue);
    // link.freq = frequencyScale(9);
    // link.particleSize = particleSize(link.value);
    link.particleSize = 2.5;
    link.particleColor = d3.scaleLinear().domain([0,1]).range([link.source.color, link.target.color]);
    link.particleAlpha = d3.scaleLinear().domain([0,1]).range([link.source.alpha, link.target.alpha]);
    sp = false;
    myPath.forEach(function(ele){
      if (ele.sx === link.source.nameX
        && ele.sy === link.source.nameY
        && ele.tx === link.target.nameX
        && ele.ty === link.target.nameY) {sp = true; } 
      else { sp = sp || false; }
    });
    link["showParticles_"+_pathName] = sp; 
    // console.log(sp);
    // console.log(link);      
  });

  var myTimer = d3.timer(tick); 
  return myTimer;

  function tick(elapsed) {
    particles = particles.filter(function (d) {
      if (d.current >= d.path.getTotalLength() && startParticles.indexOf(d.path.__data__.target.nameX) === -1){
        startParticles.push(d.path.__data__.target.nameX);
      }
      return d.current < d.path.getTotalLength();
    });

    d3.select("g.sankeyFrame.single").selectAll("path.link")
     // .filter(d => d.showParticles && startParticles.indexOf(d.source.nameX) !== -1)
     .filter(d => d["showParticles_"+_pathName] && startParticles.indexOf(d.source.nameX) !== -1)
      .each(
        function (d) {
          var offset = (Math.random() - .5) * d.dy;
          if (Math.random() < d.freq) {
            var length = this.getTotalLength();
            particles.push({link: d, time: elapsed, offset: offset, path: this, length: length, animateTime: length});
          }
        });

    particleEdgeCanvasPath(elapsed);
    if (elapsed > 20000) {
     // myTimer.stop();
      console.log("> 20000");
    }
    console.log("d3.timer runs!");
  }
  
  function particleEdgeCanvasPath(elapsed) {
    var context = d3.select("canvas.particles."+_pathName).node().getContext("2d");

    context.clearRect(0,0,cw,ch);
    context.fillStyle = "gray";
    context.lineWidth = "1px";

    for (var x in particles) {
      var currentTime = elapsed - particles[x].time;
      particles[x].current = currentTime * 0.10;
      var currentPos = particles[x].path.getPointAtLength(particles[x].current);
      var relativePos = particles[x].current/particles[x].path.getTotalLength();

      context.beginPath();
      context.fillStyle = particles[x].link.particleColor(relativePos);
      context.globalAlpha = particles[x].link.particleAlpha(relativePos);
      context.arc(currentPos.x, currentPos.y + particles[x].offset, particles[x].link.particleSize, 0, 2*Math.PI);
      context.fill();
    }
  }
}