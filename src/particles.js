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

export function initializeParticles(_graph, _particleStart) {
  /*
  var linkExtent = d3.extent(_graph.links, function (d) {return d.value;});
  var frequencyScale = d3.scaleLinear().domain(linkExtent).range([0.05,1]);
  */
  
  d3.selectAll("g.sankeyFrame.single rect.sankeyNode").each(function(d){
    d.color = d3.select(this).style("fill");
    d.alpha = d3.select(this).style("fill-opacity");
  });

  /*
  var myPath = [];
  // myPath.push("firstPath");
  /*
  myPath.push({sx: "0", sy: "home", tx: "1", ty: "search"});
  myPath.push({sx: "1", sy: "search", tx: "2", ty: "product"});
  myPath.push({sx: "2", sy: "product", tx: "3", ty: "other"});
  myPath.push({sx: "2", sy: "product", tx: "3", ty: "home"});
  
  myPath.push({sx: "before meetup1", sy: "joined meetup group", tx: "meetup1", ty: "responded and showed up"});
  myPath.push({sx: "meetup1", sy: "responded and showed up", tx: "meetup2", ty: "responded but did not show up"});
  */
  /*
  var sp;
  _graph.links.forEach(function (link) {
    link.freq = frequencyScale(link.value);
    // link.particleSize = particleSize(link.value);
    link.particleSize = 2.5;
    link.particleColor = d3.scaleLinear().domain([0,1]).range([link.source.color, link.target.color]);
    link.particleAlpha = d3.scaleLinear().domain([1,1000]).range([link.source.alpha, link.target.alpha]);
    sp = false;
    myPath.forEach(function(ele){
      if (ele.sx === link.source.nameX
        && ele.sy === link.source.nameY
        && ele.tx === link.target.nameX
        && ele.ty === link.target.nameY) {sp = true; } 
      else { sp = sp || false; }
    });
    link.showParticles = sp;
  });
  */

  let cw = d3.select("div.sankeyChart svg").attr("width");
  let ch = d3.select("div.sankeyChart svg").attr("height");
  d3.select("div.sankeyChart").insert("canvas", ":first-child").attr("width", cw).attr("height", ch);
  var context = d3.select("canvas").node().getContext("2d");
  context.clearRect(0,0,cw,ch);
  context.translate(_particleStart.x, _particleStart.y);
}

export function drawParticles(_graph, myPath, _sequenceStart){
  var startParticles = [_sequenceStart];
  // var freqCounter = 1;
  var myTimer = d3.timer(tick);
  var particles = [];
  let cw = d3.select("div.sankeyChart svg").attr("width");
  let ch = d3.select("div.sankeyChart svg").attr("height");

  var sp;
  var linkExtent = d3.extent(_graph.links, function (d) {return d.value;});
  var frequencyScale = d3.scaleLinear().domain(linkExtent).range([0.05,1]);
  _graph.links.forEach(function (link) {
    link.freq = frequencyScale(link.value);
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
    link.showParticles = sp;
  });

  function tick(elapsed) {
    //1 particles = particles.filter(function (d) {return d.time > (elapsed - 1000);});
    particles = particles.filter(function (d) {
      if (d.current >= d.path.getTotalLength() && startParticles.indexOf(d.path.__data__.target.nameX) === -1){
        startParticles.push(d.path.__data__.target.nameX);
      }
      return d.current < d.path.getTotalLength();
    });

    d3.select("g.sankeyFrame.single").selectAll("path.link")
     // .filter(d => d.showParticles && d.startParticles <= elapsed)
     .filter(d => d.showParticles && startParticles.indexOf(d.source.nameX) !== -1)
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
      myTimer.stop();
      console.log("hier");
    }
  }
  
  function particleEdgeCanvasPath(elapsed) {
    var context = d3.select("canvas").node().getContext("2d");

    context.clearRect(0,0,cw,ch);
    context.fillStyle = "gray";
    context.lineWidth = "1px";
    for (var x in particles) {
      var currentTime = elapsed - particles[x].time;
      // 1 var currentPercent = currentTime / 1000 * particles[x].path.getTotalLength();
      // particles[x].current = currentTime * 0.10;
      particles[x].current = currentTime / 1000 * particles[x].path.getTotalLength();
      var currentPos = particles[x].path.getPointAtLength(particles[x].current);
      var relativePos = particles[x].current/particles[x].path.getTotalLength();

      context.beginPath();
      context.fillStyle = particles[x].link.particleColor(relativePos);
      // context.globalAlpha = particles[x].link.particleAlpha(currentTime);
      context.globalAlpha = particles[x].link.particleAlpha(relativePos);
      context.arc(currentPos.x, currentPos.y + particles[x].offset, particles[x].link.particleSize, 0, 2*Math.PI);
      context.fill();
    }
  }
  // end particle 2
}