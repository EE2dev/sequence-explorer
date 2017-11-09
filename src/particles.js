import * as d3 from "d3";

// start Particles - idea from https://bl.ocks.org/emeeks/21f99959d48dd0d0c746
          // to do extend for multiples
          // display paths div
          // translate dynamically
          // calc size of canvas dynamically
          // adjust colors dynamically
          // to do width + height
          // tooltip disappeared
          // interrupt on click on none

export function initializeParticles(_graph) {
  d3.select("div.sankeyChart").insert("canvas", ":first-child").attr("width", 1000).attr("height", 1000);
  var linkExtent = d3.extent(_graph.links, function (d) {return d.value;});
  var frequencyScale = d3.scaleLinear().domain(linkExtent).range([1,100]);
  var particleSize = d3.scaleLinear().domain(linkExtent).range([1,5]);  
  
  d3.selectAll("rect.sankeyNode").each(function(d){
    d.color = d3.select(this).style("fill");
    d.alpha = d3.select(this).style("fill-opacity");
  });

  var myPath = [];
  // myPath.push("firstPath");
  myPath.push({sx: "0", sy: "home", tx: "1", ty: "search"});
  myPath.push({sx: "1", sy: "search", tx: "2", ty: "product"});
  myPath.push({sx: "2", sy: "product", tx: "3", ty: "other"});
  myPath.push({sx: "2", sy: "product", tx: "3", ty: "home"});

  var sp;
  _graph.links.forEach(function (link) {
    link.freq = frequencyScale(link.value);
    link.particleSize = particleSize(link.value);
    link.particleColor = d3.scaleLinear().domain([1,1000]).range([link.source.color, link.target.color]);
    link.particleAlpha = d3.scaleLinear().domain([1,1000]).range([link.source.alpha, link.target.alpha]);
    sp = false;
    myPath.forEach(function(ele){
      if (ele.sx === link.source.nameX
        && ele.sy === link.source.nameY
        && ele.tx === link.target.nameX
        && ele.ty === link.target.nameY) {sp = true;} 
      else { sp = sp || false; }
    });
    link.showParticles = sp;
  });
}

export function drawParticles(){
  var startP = true;
  var freqCounter = 1;
  d3.timer(tick, 1000);
  var particles = [];

  function tick(elapsed) {
    particles = particles.filter(function (d) {return d.time > (elapsed - 1000);});

    if (freqCounter > 100) {
      freqCounter = 1;
    }

    d3.select("g.sankeyFrame.single").selectAll("path.link")
      .filter(d => d.showParticles)
      .each(
    function (d) {
      if (d.freq >= freqCounter) {
        var offset = (Math.random() - .5) * d.dy;
        particles.push({link: d, time: elapsed, offset: offset, path: this});
      }
    });

    particleEdgeCanvasPath(elapsed);
    freqCounter++;
  }

  function particleEdgeCanvasPath(elapsed) {
    var context = d3.select("canvas").node().getContext("2d");

    context.clearRect(0,0,1000,1000);
    context.fillStyle = "gray";
    context.lineWidth = "1px";
    // TO DO translate
    if (startP) { context.translate(44.5 + 5, 20 + 5); startP = false;}

    for (var x in particles) {
      var currentTime = elapsed - particles[x].time;
      var currentPercent = currentTime / 1000 * particles[x].path.getTotalLength();
      var currentPos = particles[x].path.getPointAtLength(currentPercent);
      context.beginPath();
      context.fillStyle = particles[x].link.particleColor(currentTime);
      context.globalAlpha = particles[x].link.particleAlpha(currentTime);
      context.arc(currentPos.x,currentPos.y + particles[x].offset,particles[x].link.particleSize,0,2*Math.PI);
      context.fill();
    }
  }
}