import * as d3 from "d3";

// start Particles - idea from https://bl.ocks.org/emeeks/21f99959d48dd0d0c746

export function particles() {
  let publicAPI = function(){};
  let allPaths = [];
  let cw; // canvas width
  let ch; // canvas height
  let frequencyScale;
  let myTimer = {};
  let particleSpeed;
  let particleShape;
  let particleSize;
  let pathName;
  let svgPaths;
  let context;
  let canvasTranslate;
  let nodeWidth;
  
  /*
    @args
    _svgPaths: the SVG paths
    _canvasTL: the absolute position of the tol left corner is _canvasTL.x, _canvasTL.y
    _pathName: name of the path
    _myPath: an array of objects containing the source and target positions of each path element
    _sequenceStart: first element of sequence where the path begins
    _linkMax: maximum possible value of any path (for computing proportionally the number of particles)  
    _linkValue: the value of _myPath (for computing proportionally the number of particles) 
    _particleMin: sets the minimum value for the particle scale which determines the maximum number of particles when compared to a rondom number [0;1]
    _particleMax: sets the maximum value for the particle scale which determines the maximum number of particles when compared to a rondom number [0;1]
    _particleSpeed: sets the speed of particles. The default speed is 0.1.
    _particleShape: sets the shape of the particles. The default is "circle".
    _particleSize: size of particle (circle or person)
    _nodeWidth: width of the sankey node in pixels.
  */ 
  publicAPI.init = function (_svgPaths, _canvasTL, _pathName, _myPath, _sequenceStart, _linkMax,
    _linkValue, _particleMin, _particleMax, _particleSpeed, _particleShape, _particleSize, _nodeWidth){
    
    if (d3.select("div.sankeyChart").selectAll("canvas").size() === 0) {
      initializeCanvas(_canvasTL, _linkMax, _particleMin, _particleMax, _particleSpeed, _particleShape, _particleSize, _nodeWidth);
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

  function initializeCanvas(_canvasTranslate, _linkMax, _particleMin, _particleMax, 
      _particleSpeed, _particleShape, _particleSize, _nodeWidth) { 
    particleSpeed = _particleSpeed;
    particleShape = _particleShape;
    particleSize = _particleSize;
    canvasTranslate = _canvasTranslate;
    nodeWidth = _nodeWidth;
    allPaths.remove = -1;
    frequencyScale = d3.scaleLinear().domain([1, _linkMax]).range([_particleMin, _particleMax]);
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
          myLink.particleSize = 2.5 * particleSize;
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
              if (d.current - d.path.getTotalLength() <= nodeWidth) { // continue moving upon node
                d.current = 0;
                d.diffToNextY = (l.svgPath.getPointAtLength(0).y + d.offsetFactor * l.dy) - (d.lastPosition.y + d.offsetFactor * d.link.dy);
                d.node = true;
              } else { // follow new path
                d.link = l;
                d.offset = d.offsetFactor * l.dy;
                d.current = 0;
                d.time = elapsed;
                d.path = l.svgPath;
                d.lastPosition = d.path.getPointAtLength(d.path.getTotalLength());
                d.node = false;
              }
            });
        } // end if       
      });

      _path["particles"] = _path["particles"].filter(function(d){return d.current < d.path.getTotalLength();});

      _path["links"]
      .filter(d => _path["sequenceStart"] === d.sourceX) 
      .forEach(function (d) {
        let factor =  (Math.random() - .5);
        if (Math.random() < d.freq) {
          var offset = factor * d.dy;
          var lastPos = d.svgPath.getPointAtLength(d.svgPath.getTotalLength());
          _path["particles"].push({link: d, time: elapsed, offset: offset, offsetFactor: factor, 
            path: d.svgPath, node: false, lastPosition: lastPos, diffToNextY: 0});
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
        particles[x].current = currentTime * particleSpeed;

        var currentPos;
        var relativePos;
        
        if (particles[x].node) { 
          relativePos = 1; 
          currentPos = particles[x].path.getPointAtLength(particles[x].path.getTotalLength());
          var partOfNode = particles[x].current - particles[x].path.getTotalLength();
          currentPos.x = currentPos.x + partOfNode;
          currentPos.y = currentPos.y + partOfNode/nodeWidth * particles[x].diffToNextY;
        } else { 
          currentPos = particles[x].path.getPointAtLength(particles[x].current);
          relativePos = particles[x].current/particles[x].path.getTotalLength();
        }

        context.fillStyle = particles[x].link.particleColor(relativePos);
        context.globalAlpha = particles[x].link.particleAlpha(relativePos);

        if (particleShape === "circle") {
          context.beginPath();
          context.arc(currentPos.x, currentPos.y + particles[x].offset, particles[x].link.particleSize, 0, 2*Math.PI);
          context.closePath();
          context.fill();
        } else if (particleShape === "person") {
          drawPerson(context, currentPos.x, currentPos.y + particles[x].offset);
        }      
      }
    });
  }  

  function drawPerson(context, x, y) {
    let factor = 0.05 * particleSize;
    context.translate((-653)*factor, (- 768)*factor);
    context.translate(x + canvasTranslate.x, y + canvasTranslate.y);
    context.scale(factor, factor);
    context.save();
    context.translate(294.11,29.495);
    context.beginPath();
    context.moveTo(315.67,347.53);
    context.bezierCurveTo(315.67,368.03299999999996,299.04900000000004,384.65299999999996,278.547,384.65299999999996);
    context.bezierCurveTo(258.04400000000004,384.65299999999996,241.42400000000004,368.032,241.42400000000004,347.53);
    context.bezierCurveTo(241.42400000000004,327.027,258.045,310.407,278.547,310.407);
    context.bezierCurveTo(299.05,310.407,315.67,327.02799999999996,315.67,347.53);
    context.closePath();
    context.fill();
    context.stroke();

    context.restore();
    context.stroke();  
    context.beginPath();
    context.moveTo(516.35,490.41);
    context.bezierCurveTo(516.35,490.41,486.011,647.94,479.47900000000004,658.6);
    context.bezierCurveTo(473.89250000000004,667.7154,430.29900000000004,739.242,430.29900000000004,739.242);
    context.bezierCurveTo(420.99250000000006,754.502,429.81161000000003,765.4119999999999,439.67140000000006,771.1039999999999);
    context.bezierCurveTo(448.06520000000006,775.9495999999999,466.1084000000001,774.7497999999999,472.0744000000001,764.5739);
    context.bezierCurveTo(472.0744000000001,764.5739,520.4404000000001,689.3069,525.7174000000001,673.0739);
    context.bezierCurveTo(529.3708000000001,661.8359,537.8604000000001,615.2169,537.8604000000001,615.2169);
    context.bezierCurveTo(537.8604000000001,615.2169,584.8564000000001,663.6869,590.0034000000002,672.3599);
    context.bezierCurveTo(596.4910000000002,683.2929,608.5744000000002,759.5029000000001,608.5744000000002,759.5029000000001);
    context.bezierCurveTo(611.4642000000002,773.0629,624.3964000000002,777.4849,637.8604000000003,775.2169000000001);
    context.bezierCurveTo(648.4934000000003,773.4261000000001,659.6134000000003,766.2318000000001,657.1464000000003,753.0739000000001);
    context.bezierCurveTo(657.1464000000003,753.0739000000001,646.4004000000003,664.7139000000001,637.8604000000003,650.2139000000001);
    context.bezierCurveTo(627.6694000000002,632.9119000000001,572.8604000000003,573.7849000000001,572.8604000000003,573.7849000000001);
    context.lineTo(588.5744000000003,503.7849000000001);
    context.bezierCurveTo(588.5744000000003,503.7849000000001,598.6604000000003,524.2309000000001,605.7174000000003,533.0709000000002);
    context.bezierCurveTo(613.7429000000003,543.1239000000002,664.2884000000004,572.3569000000002,664.2884000000004,572.3569000000002);
    context.bezierCurveTo(668.9247000000004,575.4666000000002,679.4214000000004,573.7531000000002,683.5744000000004,565.9283000000003);
    context.bezierCurveTo(686.9076000000005,559.6477000000002,686.7507000000004,549.4743000000003,679.2887000000004,544.4993000000003);
    context.bezierCurveTo(679.2887000000004,544.4993000000003,637.6337000000004,518.3483000000003,627.8597000000004,510.2133000000003);
    context.bezierCurveTo(616.9897000000004,501.1833000000003,594.9997000000004,440.9433000000003,594.9997000000004,440.9433000000003);
    context.bezierCurveTo(588.1789000000005,431.5569000000003,578.8487000000005,421.2013000000003,562.8567000000004,420.9433000000003);
    context.bezierCurveTo(546.7377000000004,420.6830200000003,538.6697000000004,429.5629000000003,531.4277000000004,434.51430000000033);
    context.bezierCurveTo(531.4277000000004,434.51430000000033,469.6807000000004,479.61930000000035,463.57070000000044,488.80030000000033);
    context.bezierCurveTo(457.4238000000004,498.0363000000003,446.4277000000004,567.3713000000004,446.4277000000004,567.3713000000004);
    context.bezierCurveTo(444.70410000000044,575.2713000000003,447.7898000000004,581.6243000000004,457.1417000000004,583.8003000000003);
    context.bezierCurveTo(468.5847000000004,586.4623000000004,476.7867000000004,579.3369000000004,477.8557000000004,573.8003000000003);
    context.bezierCurveTo(477.8557000000004,573.8003000000003,484.9065000000004,519.0353000000003,489.99870000000044,510.94330000000036);
    context.bezierCurveTo(495.92750000000046,501.52190000000036,516.3447000000004,490.42230000000035,516.3447000000004,490.42230000000035);
    context.closePath();
    context.fill();
    context.stroke();
    context.setTransform(1, 0, 0, 1, 0, 0);
  }

  return publicAPI;
}