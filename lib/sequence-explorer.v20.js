(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3'), require('d3-interpolate'), require('d3-array'), require('d3-scale'), require('d3-collection')) :
    typeof define === 'function' && define.amd ? define(['exports', 'd3', 'd3-interpolate', 'd3-array', 'd3-scale', 'd3-collection'], factory) :
    (factory((global.sequenceExplorer = global.sequenceExplorer || {}),global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, function (exports,d3,d3Interpolate,d3Array,d3Scale,d3Collection) { 'use strict';

    function sankeySeq () {
      var sankey = {},
          debugOn = false,
          nodeWidth = 15,
          nodePadding = 8,
          size = [700, 500],
          sequence = [],
          categories = [],
          corrCategories,
          // possible subset of categories for calculating percentages
      ky,
          // scaling factor for height of node
      maxValue,
          // the max of all node values
      maxValueSpecified = false,
          // true if maxValue is specified through API
      nodes = [],
          links = [],
          xScale,
          yScale;

      sankey.debugOn = function (_) {
        if (!arguments.length) return debugOn;
        debugOn = _;
        return sankey;
      };

      sankey.nodeWidth = function (_) {
        if (!arguments.length) return nodeWidth;
        nodeWidth = +_;
        return sankey;
      };

      sankey.nodePadding = function (_) {
        if (!arguments.length) return nodePadding;
        nodePadding = +_;
        return sankey;
      };

      sankey.nodes = function (_) {
        if (!arguments.length) return nodes;
        nodes = _;
        return sankey;
      };

      sankey.links = function (_) {
        if (!arguments.length) return links;
        links = _;
        return sankey;
      };

      sankey.sequence = function (_) {
        if (!arguments.length) return sequence;
        sequence = _;
        return sankey;
      };

      sankey.categories = function (_) {
        if (!arguments.length) return categories;
        categories = _;
        return sankey;
      };

      sankey.correspondingCategories = function (_) {
        if (!arguments.length) return corrCategories();else {
          corrCategories = function corrCategories() {
            return _;
          };
        }
        return sankey;
      };

      sankey.size = function (_) {
        if (!arguments.length) return size;
        size = _;
        return sankey;
      };

      sankey.xScale = function (_) {
        if (!arguments.length) return xScale;
        xScale = _;
        return sankey;
      };

      sankey.yScale = function (_) {
        if (!arguments.length) return yScale;
        yScale = _;
        return sankey;
      };

      sankey.relayout = function () {
        computeLinkDepths();
        return sankey;
      };

      sankey.link = function () {
        var curvature = .5;

        function link(d) {
          curvature = Math.abs(d.source.x - d.target.x) < d.source.dx ? -3 : 0.5; // makes curved paths for nodes at the same horizontal position
          var x0 = d.source.x + d.source.dx,
              x1 = d.target.x,
              xi = d3Interpolate.interpolateNumber(x0, x1),
              x2 = xi(curvature),
              x3 = xi(1 - curvature),
              y0 = d.source.y + d.sy + d.dy / 2,
              y1 = d.target.y + d.ty + d.dy / 2;
          return "M" + x0 + "," + y0 + "C" + x2 + "," + y0 + " " + x3 + "," + y1 + " " + x1 + "," + y1;
        }

        link.curvature = function (_) {
          if (!arguments.length) return curvature;
          curvature = +_;
          return link;
        };

        return link;
      };

      sankey.layout = function () {
        computeNodeLinks();
        computeNodeValues();
        computeNodeSizes(); // new
        computeNodePositions(); // new
        computeLinkDepths();
        return sankey;
      };

      sankey.getNodeHeight = function (value) {
        return value * ky;
      };

      sankey.maxValue = function (value) {
        if (!arguments.length) return maxValue;
        if (value === -1) {
          maxValueSpecified = false;return;
        }
        maxValue = value;
        maxValueSpecified = true;
        return sankey;
      };

      // adds value properties to nodes which can be used by the tooltip text and transitions
      // Has to be called after layout function 
      sankey.addValues = function () {
        var newValues = d3Collection.map();
        var rIndex = void 0;
        sequence.forEach(function (seq) {
          newValues.set(seq, 0);
        });
        categories.forEach(function (cat) {
          newValues.set(cat, 0);
        });

        var key = void 0;
        nodes.forEach(function (node) {
          newValues.set(node.nameX, newValues.get(node.nameX) + node.value);
          newValues.set(node.nameY, newValues.get(node.nameY) + node.value);

          if (corrCategories().indexOf(node.nameY) !== -1) {
            corrCategories().forEach(function (cat) {
              key = "corr" + node.nameX + cat;
              if (typeof newValues.get(key) === "undefined") {
                newValues.set(key, 0);
              }
              newValues.set(key, newValues.get(key) + node.value);
            });
          }

          rIndex = -1;
          sequence.forEach(function (seq, i) {
            if (seq === node.nameX) {
              rIndex = i;
            }
          });

          if (rIndex === 0) {
            newValues.set("first" + sequence[0] + node.nameY, node.value);
          }
          if (rIndex !== sequence.length - 1) {
            newValues.set("prev" + sequence[rIndex + 1] + node.nameY, node.value);
          }
        });

        nodes.forEach(function (node) {
          node.valueX = newValues.get(node.nameX); // sum of category values
          node.valueY = newValues.get(node.nameY); // sum of event values
          node.valueXCorr = newValues.get("corr" + node.nameX + node.nameY); // sum of corresponding event values
          node.valueYPrev = newValues.get("prev" + node.nameX + node.nameY); // value of category at previous event
          node.valueYFirst = newValues.get("first" + sequence[0] + node.nameY); // value of category at first event
          // node.allValues = newValues;
        });
      };

      // end of API functions

      // Populate the sourceLinks and targetLinks for each node.
      // Also, if the source and target are not objects, assume they are indices.
      function computeNodeLinks() {
        nodes.forEach(function (node) {
          node.sourceLinks = [];
          node.targetLinks = [];
        });
        links.forEach(function (link) {
          var source = link.source,
              target = link.target;
          if (typeof source === "number") source = link.source = nodes[link.source];
          if (typeof target === "number") target = link.target = nodes[link.target];
          source.sourceLinks.push(link);
          target.targetLinks.push(link);
        });
      }

      // Compute the value (size) of each node by summing the associated links.
      function computeNodeValues() {
        nodes.forEach(function (node) {
          node.value = Math.max(d3Array.sum(node.sourceLinks, value), d3Array.sum(node.targetLinks, value));
        });
      }

      // Compute the y extend of nodes and links
      function computeNodeSizes() {
        maxValue = maxValueSpecified ? maxValue : d3Array.max(nodes, function (d) {
          return d.value;
        });
        // calculate scaling factor ky based on #categories, height, nodePAdding and maxNodeValue
        ky = (size[1] / categories.length - nodePadding) / maxValue;

        if (debugOn) {
          console.log("ky: " + ky);
        }

        nodes.forEach(function (node) {
          node.dy = node.value * ky;
          node.dx = nodeWidth;
        });

        links.forEach(function (link) {
          link.dy = link.value * ky;
        });
      }

      function computeNodePositions() {
        if (debugOn) {
          console.log(size);
        }
        xScale = d3Scale.scalePoint().domain(sequence).range([0, size[0] - nodeWidth]);
        yScale = d3Scale.scalePoint().domain(categories).range([size[1], size[1] / categories.length]);

        nodes.forEach(function (element) {
          element.x = xScale(element.nameX);
          element.y = yScale(element.nameY) - element.dy;

          if (debugOn) {
            console.log("x " + element.nameX + " -> " + element.x);
            console.log("y " + element.nameY + " -> " + element.y);
          }
        });

        if (debugOn) {
          console.log(nodes);
        }
      }

      // changed to paths from the bottom not from the top
      function computeLinkDepths() {
        nodes.forEach(function (node) {
          node.sourceLinks.sort(ascendingTargetDepth);
          node.targetLinks.sort(ascendingSourceDepth);
        });

        // compute sum of path heights for source and target paths
        var nodeSy = [];
        var nodeTy = [];
        nodes.forEach(function (node, i) {
          nodeSy[i] = 0;
          nodeTy[i] = 0;
          node.sourceLinks.forEach(function (link) {
            nodeSy[i] += link.dy;
          });
          node.targetLinks.forEach(function (link) {
            nodeTy[i] += link.dy;
          });
        });

        nodes.forEach(function (node, i) {
          // var sy = 0, ty = 0;
          var sy = node.dy - nodeSy[i];
          var ty = node.dy - nodeTy[i];
          node.sourceLinks.forEach(function (link) {
            link.sy = sy;
            sy += link.dy;
          });
          node.targetLinks.forEach(function (link) {
            link.ty = ty;
            ty += link.dy;
          });
        });

        function ascendingSourceDepth(a, b) {
          if (a.source.name === a.target.name) {
            return -1;
          }
          if (b.source.name === b.target.name) {
            return 1;
          }
          return a.source.y - b.source.y;
        }

        function ascendingTargetDepth(a, b) {
          if (a.source.name === a.target.name) {
            return -1;
          }
          if (b.source.name === b.target.name) {
            return 1;
          }
          return a.target.y - b.target.y;
        }
      }

      function value(link) {
        return link.value;
      }

      return sankey;
    }

    // helper function for calculating the position of the tooltip for node and node info
    function positionTooltipNode(tooltip) {
      var twidth = 19; // padding + border + 5
      var theight = 19; // padding + border + 5

      var index = tooltip.style("width").indexOf("px");
      if (index != -1) twidth += +tooltip.style("width").substr(0, index);

      index = tooltip.style("height").indexOf("px");
      if (index != -1) theight += +tooltip.style("height").substr(0, index);

      var top = d3.event.pageY - 100 < 0 ? d3.event.pageY + 23 : d3.event.pageY - theight;
      var left = d3.event.pageX + 250 < window.innerWidth ? d3.event.pageX + 5 : d3.event.pageX - twidth;

      return tooltip.style("top", top + "px").style("left", left + "px");
    }

    // helper function for getting the transform attributes
    // from http://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4

    function getTranslation(transform) {
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
    function formatNumber(str, thousandsSeparator, form) {
      if (isNaN(parseFloat(str))) {
        return "-";
      }
      var format = d3.format(form);
      if (thousandsSeparator === ".") {
        // German convention
        if (+str % 1 !== 0) {
          return format(str).split(".").join(",");
        } else {
          var newStr = format(str).split(",").join(".");
          return newStr;
        }
      } else {
        // US convention
        if (+str % 1 !== 0) {
          return format(str);
        } else {
          return format(str);
        }
      }
    }

    // helper function to sort row and col dimension ascending or as specified
    function orderDimension(dim) {
      if (typeof dim === "undefined") {
        return d3.ascending;
      } else {
        return function (a, b) {
          return dim.indexOf(a) - dim.indexOf(b);
        };
      }
    }

    // helper function to get the column und row number of single sankeyFrame within small multiples
    function getColRowOfSingle() {
      var coord = d3.select("g.sankeyFrame.single").attr("class").split(" ")[1]; // e.g. f0-0
      var coord2 = coord.substring(1, coord.length).split("-"); // e.g. ["0","0"]

      return { col: +coord2[0], row: +coord2[1] };
    }

    // draws axes and returns an Object with properties
    // paddingSingle, paddingMultiples, width, height
    // for further processing in function createChart()
    function initialize_whp_and_axes(svg, size, margin, categories, sequence, nodeWidth) {
      var width = size[0] - margin.left - margin.right;
      var height = size[1] - margin.bottom - margin.top;
      var paddingSingle = { left: 0, bottom: 0, right: 0, top: 20 };
      var paddingMultiples = { left: 20, bottom: 0, right: 0, top: 20 }; // fixed

      // drawing axes - step 1: determine size of sankey
      var axisL = svg.append("g").attr("class", "dummy d1").style("opacity", 0).call(d3.axisLeft(d3.scalePoint().domain(categories)));

      var axisB = svg.append("g").attr("class", "dummy d2").style("opacity", 0).call(d3.axisBottom(d3.scalePoint().domain(sequence)));

      var lengthOfLastEvent = d3.select("g.dummy.d2 g.tick:last-child text"); // text which can extend the width of the x axis

      paddingSingle.left = axisL.node().getBBox().width;
      paddingSingle.bottom = axisB.node().getBBox().height;
      var extendBAxis = lengthOfLastEvent.node().getBBox().width / 2;

      // update width and height for sankeyG
      width = width - paddingSingle.left - extendBAxis - 7; // subtracting 7px for centered percentage text on top of nodes
      height = height - paddingSingle.bottom - paddingMultiples.top - 2;

      d3.selectAll("g.dummy").remove();

      var yScale = d3.scalePoint().domain(categories).range([height, height / categories.length]);
      var axisLeft = d3.axisLeft(yScale);
      var axisSelection = svg.append("g").attr("class", "axis left").style("opacity", 0).call(axisLeft);

      // drawing axes - step 2: calculate paddingSingle.Left  
      paddingSingle.left = axisSelection.node().getBBox().width;
      axisSelection.attr("transform", "translate(" + (paddingSingle.left - 1.5) + ", " + paddingSingle.top + ")");

      // adjust axis text
      d3.selectAll("g.axis.left text").attr("dy", "");

      var xScale = d3.scalePoint().domain(sequence).range([0, width - nodeWidth]); // last node starts at end of domain
      var axisBottom = d3.axisBottom(xScale);
      axisSelection = svg.append("g").attr("class", "axis bottom").style("opacity", 0).call(axisBottom);
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

      d3.selectAll("text").classed("unselect", true);

      return result;
    }

    // draws titles, axes around the sankeyGraph
    // for single graph and small multiples
    function initializeFrame(selection, props, allGraphs, colIndex, rowIndex) {
      var width = props.width;
      var height = props.height;
      var padding = props.paddingMultiples;

      var tx = colIndex * width / allGraphs.cols;
      var ty = rowIndex * height / allGraphs.rows;
      var sx = (1 / allGraphs.cols * width - padding.left) / width;
      var sy = (1 / allGraphs.rows * height - padding.top) / height;
      if (sx >= sy) {
        sx = sy;
      } else {
        sy = sx;
      } // make multiples proportional to full sized chart

      var transformString = {};
      transformString.sankeyFrame = {};
      transformString.sankeyFrame.single = "translate(" + (tx + width / 2 * sx) + ", " + (ty + height / 2 * sy) + ") scale(0.3)";
      transformString.sankeyFrame.multiples = "translate(" + tx + ", " + ty + ") ";

      transformString.sankeySeq = {};
      transformString.sankeySeq.single = "translate(" + props.paddingSingle.left + ", 20)";
      transformString.sankeySeq.multiples = "translate(" + padding.left + ", " + padding.top + ") " + "scale(" + sx + ", " + sy + ")";

      transformString.pTop = {};
      transformString.pTop.single = "translate(" + (padding.left + width / 2) + ", " + (padding.top - 3) + ")";
      transformString.pTop.multiples = "translate(" + (padding.left + width / 2 * sx) + ", " + (padding.top - 3) + ")";

      transformString.pLeft = {};
      transformString.pLeft.single = "translate(" + (padding.left - 3) + ", " + (padding.top + height / 2) + ")";
      transformString.pLeft.multiples = "translate(" + (padding.left - 3) + ", " + (padding.top + height / 2 * sy) + ")";

      return transformString;
    }

    function transitionToSingle(clickedElement, _trans) {
        var trans = typeof _trans !== "undefined" ? _trans : d3.transition().duration(1000);

        d3.selectAll("g.sankeyFrame").each(function () {
            if (this === clickedElement) {
                d3.select(this // set class
                ).classed("multiples", false).classed("single", true);

                d3.select(this // transition frame
                ).transition(trans).attr("transform", "translate(0, 0)");

                d3.select(this).selectAll("g.pTop" // transition top padding
                ).transition(trans).attr("transform", function (d) {
                    return d.single;
                });

                d3.select(this).selectAll("text.col.multiples" // hide col title on top
                ).transition(trans).style("opacity", 0);

                d3.select(this).selectAll("text.col.single" // display row + col title on top
                ).transition(trans).style("opacity", 1);

                d3.select(this).selectAll("text.nodeLabel" // display nodeLabels
                ).transition(trans).style("opacity", 1);

                d3.select(this).selectAll("g.pLeft" // hide left padding g
                ).transition(trans).style("opacity", 0);

                d3.select(this).selectAll(".sankeyNode,.sankeyNodeInfo" // display edge of rectangles
                ).transition(trans).style("stroke-width", "1px");

                d3.select(this).selectAll("g.sankeySeq" // transition graph 
                ).transition(trans).attr("transform", function (d) {
                    return d.single;
                });

                d3.selectAll(".axis" // show axes for sequence and categories
                ).transition().delay(800).style("opacity", 1);

                d3.selectAll(".coverSankeySeq" // hide surrounding rectangle
                ).transition(trans).style("opacity", 0);
            } else {
                d3.select(this // set class
                ).classed("multiples", false);

                d3.select(this).transition(trans).attr("transform", function (d) {
                    return d.single;
                }).style("opacity", 0).style("pointer-events", "none");

                d3.select(this).selectAll(".sankeyNode,.sankeyNodeInfo" // display edge of rectangles
                ).transition(trans).style("stroke-width", "1px");
            }
        });
        return false;
    }

    function transitionToMultiples(clickedElement) {
        var trans = d3.transition().duration(1000);

        d3.selectAll("g.sankeyFrame").classed("multiples", true).each(function () {
            if (this === clickedElement) {
                d3.select(this // set class
                ).classed("single", false);

                d3.select(this).transition(trans).attr("transform", function (d) {
                    return d.multiples;
                });

                d3.select(this).selectAll("g.pTop" // transition top padding
                ).transition(trans).attr("transform", function (d) {
                    return d.multiples;
                });

                d3.select(this).selectAll("text.col.multiples" // display col title on top
                ).transition(trans).style("opacity", 1);

                d3.select(this).selectAll("text.col.single" // hide row + col title on top
                ).transition(trans).style("opacity", 0);

                d3.select(this).selectAll("text.nodeLabel" // hide nodeLabels
                ).transition(trans).style("opacity", 0);

                d3.select(this).selectAll("g.pLeft" // display left padding g
                ).transition(trans).style("opacity", 1);

                d3.select(this).selectAll(".sankeyNode,.sankeyNodeInfo" // hide edge of rectangles
                ).transition(trans).style("stroke-width", "0px");

                d3.select(this).selectAll("g.sankeySeq" // transition graph 
                ).transition(trans).attr("transform", function (d) {
                    return d.multiples;
                });

                d3.selectAll(".axis").transition(trans).style("opacity", 0);

                d3.selectAll(".coverSankeySeq").transition(trans).style("opacity", 1);
            } else {
                d3.select(this).transition(trans).attr("transform", function (d) {
                    return d.multiples;
                }).style("opacity", 1).style("pointer-events", "auto");

                d3.select(this).selectAll(".sankeyNode,.sankeyNodeInfo" // hide edge of rectangles
                ).transition(trans).style("stroke-width", "0px");
            }
        });
        return true;
    }

    // compute values for transition labels
    function getPositionData(_elementsToLabel, _catSubset, height, width) {
      var labelSubset = [];
      var pData = {};

      _catSubset.forEach(function (d) {
        pData[d] = {};
      });
      for (var key in _elementsToLabel) {
        if (_elementsToLabel.hasOwnProperty(key)) {
          labelSubset.push(_elementsToLabel[key].yDest);
        }
      }

      pData.rect = getLabelSize(_elementsToLabel, 16);
      var xPos = getXPositions(_elementsToLabel, pData.rect, width);

      // rest is cat specific
      pData.yPos = getYPositions(labelSubset, pData.rect.height, height);

      _catSubset.forEach(function (d, i) {
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

        var dummy = d3.select("svg").append("g").attr("class", "dummy l1").style("opacity", 0).selectAll("text").data(Object.keys(_elementsToLabel)).enter().append("text").style("font-size", fontSize + "px").style("font-family", "sans-serif").text(function (d) {
          return _elementsToLabel[d].value;
        });

        dummy.each(function (d) {
          var ele = d3.select(this).node();
          maxWidth = ele.getBBox().width > maxWidth ? ele.getBBox().width : maxWidth;
          maxHeight = ele.getBBox().height > maxHeight ? ele.getBBox().height : maxHeight;
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

        if (positionEnd[positionEnd.length - 1] < rectHeight / 2) {
          // second pass if out of range
          dataObject = adjustTops(dataObject);
          positionEnd = trimObject(dataObject);
        }

        function createObject(data) {
          // setup data structure with rectangles from bottom to the top
          var dataObject = [];
          var obj = { top: height, bottom: height + rectHeight }; // add dummy rect for lower bound

          dataObject.push(obj);
          data.forEach(function (d) {
            obj = { top: d - rectHeight / 2, bottom: d + rectHeight / 2 };
            dataObject.push(obj);
          });
          obj = { top: 0 - rectHeight, bottom: 0 }; // add dummy rect for upper bound
          dataObject.push(obj);

          return dataObject;
        }

        function trimObject(dataObject) {
          // convert back to original array of values, also remove dummies
          var data3 = [];
          dataObject.forEach(function (d, i) {
            if (!(i === 0 || i === dataObject.length - 1)) {
              data3.push(d.top + rectHeight / 2);
            }
          });
          return data3;
        }

        function adjustBottoms(dataObject) {
          dataObject.forEach(function (d, i) {
            if (!(i === 0 || i === dataObject.length - 1)) {
              var diff = dataObject[i - 1].top - d.bottom;
              if (diff < 0) {
                // move rect up   
                d.top += diff;
                d.bottom += diff;
              }
            }
          });
          return dataObject;
        }

        function adjustTops(dataObject) {
          for (var i = dataObject.length; i-- > 0;) {
            if (!(i === 0 || i === dataObject.length - 1)) {
              var diff = dataObject[i + 1].bottom - dataObject[i].top;
              if (diff > 0) {
                // move rect down
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

    // transition labels
    function transitionAxis(_pData, _axis, catSubset, _trans) {
          var ele = _pData[Object.keys(_pData)[0]]; // pick first element since x values are the same
          var translateX = ele.xLabel; // x value of element - x translation of scale

          var sel = _axis.selectAll("g.tick").data(catSubset, function (d) {
                return d;
          }).each(function (d) {
                // compute y transform
                var yOffset = d3.select(this).attr("transform");
                var transYOffset = getTranslation(yOffset)[1] + 0.5; // 0.5 translate line
                var translateY = _pData[d].yLabel - transYOffset;
                d3.select(this).selectAll("text").transition(_trans).attr("transform", function (d) {
                      var translateXNew = _pData[d].labelLeft ? translateX : translateX + _pData[d].textWidth;
                      return "translate(" + translateXNew + ", " + translateY + ")";
                }).style("font-size", "16px").attr("dy", "0.35em" // slight transition from 0.32 otherwise animation ends with jump
                ).on("end", function () {
                      d3.select(this).text(function (d) {
                            return _pData[d].value;
                      });
                });

                d3.select(this).selectAll("line").transition(_trans).attr("x1", 0).attr("y1", function (d) {
                      return 0.5 + _pData[d].yTrans;
                }).attr("x2", function () {
                      return ele.labelLeft ? -6 : 6;
                }).attr("transform", function () {
                      return "translate(" + translateX + ", " + translateY + ")";
                });
          });

          sel.exit().transition(_trans).style("opacity", 0);

          _axis.selectAll("path.domain").transition(_trans).style("opacity", 0);
    }

    // transition back
    function transitionBack(_axis, catSubset, _trans) {
          var sel = _axis.selectAll("g.tick").data(catSubset, function (d) {
                return d;
          }).each(function () {
                d3.select(this).selectAll("text").text(function (d) {
                      return d;
                }).transition(_trans).attr("transform", "translate(0, 0)").style("font-size", "10px").attr("dy", "0.32em");

                d3.select(this).selectAll("line").transition(_trans).attr("x1", 0).attr("y1", 0.5).attr("x2", -6).attr("y2", 0.5).attr("transform", "translate(0,0)");
          });

          sel.exit().transition(_trans).style("opacity", 1);

          _axis.selectAll("path.domain").transition(_trans).style("opacity", 1);
    }

    function transitionXaxis(transitionX, nameX, nodeInfos, _thousandsSeparator) {
      var trans = d3.transition().duration(1000);
      var myFrame = d3.select("g.sankeyFrame.single");
      var frameY = myFrame.select(".coverSankeySeq").node().getBBox().height;

      hideSelection(myFrame.selectAll("g.links"), trans); // hide links  
      hideSelection(myFrame.selectAll("g.node").filter(function (d) {
        return d.nameX !== nameX;
      }), trans); // hide not selected nodes
      hideSelection(myFrame.selectAll("g.node").filter(function (d) {
        return d.nameX === nameX;
      }).filter(function (d) {
        return transitionX().indexOf(d.nameY) === -1;
      }), trans); // in case some categories are excluded for transition

      // calculate position for nodes
      var updateNodes = myFrame.selectAll("g.node").filter(function (d) {
        return d.nameX === nameX;
      }).filter(function (d) {
        return transitionX().indexOf(d.nameY) !== -1;
      });
      var newValue = 0;
      var tempValue = 0;
      var arrOfValues = [];
      // initialize arrOfValues with selected categories 
      transitionX().forEach(function (element) {
        arrOfValues.push({ name: element, value: 0 });
      });

      // add individual values to categories in arrOfValues
      var sumOfValues = 0;
      updateNodes.each(function (d) {
        arrOfValues.forEach(function (element) {
          if (element.name === d.nameY) {
            element.value = d.value;
            sumOfValues += d.value;
          }
        });
      });

      // update values to reflect cumulative values
      arrOfValues.forEach(function (element) {
        tempValue = element.value;
        element.value = newValue;
        newValue += tempValue;
      });

      // set up scale to map cumulative values to position on SVG
      var rectY = d3.scaleLinear().domain([0, sumOfValues]).range([0, frameY - 10]);
      var translateY = {};
      var translateYHeight = {};

      updateNodes.transition(trans).attr("transform", function (d) {
        var transX = getTranslation(d3.select(this).attr("transform"))[0];
        var transY = 0;
        arrOfValues.forEach(function (element) {
          if (element.name === d.nameY) {
            transY = frameY - rectY(element.value + d.value);
            translateY[d.nameY] = transY;
            translateYHeight[d.nameY] = rectY(d.value);
          }
        });
        return "translate (" + transX + "," + transY + ")";
      });

      // transition regular nodes
      updateNodes.selectAll("rect.sankeyNode").transition(trans).attr("height", function (d) {
        return rectY(d.value);
      });

      // transition node infos
      var updateNodeInfos = updateNodes.selectAll("rect.sankeyNodeInfo");
      updateNodeInfos.classed("zoomed", true).each(function (d) {
        nodeInfos.nodeInfoKeys.forEach(function (key) {
          d.nodeInfos[key + "_transY"] = rectY(d.value - +d.nodeInfos[key]);
          d.nodeInfos[key + "_transHeight"] = rectY(+d.nodeInfos[key]);
        });
      });

      updateNodeInfos.transition(trans).attr("y", function (d) {
        return d.nodeInfos[nodeInfos.nodeInfoKey + "_transY"];
      }).attr("height", function (d) {
        return d.nodeInfos[nodeInfos.nodeInfoKey + "_transHeight"];
      });

      // initialize variables for label transition
      var xStartElement = getTranslation(updateNodes.attr("transform"))[0];
      var nodeWidth = +updateNodes.selectAll("rect").filter(function (d, i) {
        return i === 0;
      }).attr("width") + 1;
      var dataSubset = {};
      var tValue = {};
      var catSubsetInit = transitionX();
      var catSubset = []; // reduce catSubsetInit to the node which exist at the x position
      updateNodes.each(function (d) {
        dataSubset[d.nameY] = getTranslation(d3.select(this).attr("transform"))[1];
        tValue[d.nameY] = formatNumber("" + d.value / d.valueXCorr, _thousandsSeparator, ",.1%");
      });

      catSubsetInit.forEach(function (cat) {
        updateNodes.filter(function (d) {
          return d.nameY === cat;
        }).each(function () {
          return catSubset.push(cat);
        });
      });

      var axis = d3.selectAll("g.axis.left");
      var width = myFrame.selectAll(".sankeySeq").node().getBBox().width;
      var height = myFrame.selectAll(".sankeySeq").node().getBBox().height;

      var elementsToLabel = {};
      catSubset.forEach(function (d, i) {
        elementsToLabel[d] = {
          index: i,
          xLeft: xStartElement,
          xRight: xStartElement + nodeWidth,
          yDest: translateY[d] + translateYHeight[d] / 2,
          value: tValue[d] + " " + d
        };
      });
      var pData = getPositionData(elementsToLabel, catSubset, height, width);
      transitionAxis(pData, axis, catSubset, trans);
    }

    function transitionXaxisBack(_corrCategories, nameX, nodeInfos) {
      var myFrame = d3.select("g.sankeyFrame.single");
      var trans = d3.transition().duration(1000);

      var axis = d3.selectAll("g.axis.left");
      var catSubsetInit = _corrCategories();
      var catSubset = []; // reduce catSubsetInit to the nodes which exist at the x position
      var updateNodes = myFrame.selectAll("g.node").filter(function () {
        return !d3.select(this).classed("hide");
      });

      updateNodes.each(function (d) {
        if (catSubsetInit.indexOf(d.nameY) !== -1) {
          catSubset.push(d.nameY);
        }
      });
      transitionBack(axis, catSubset, trans); // show y axis

      // translate zoom transitioned nodes to original position
      updateNodes.transition(trans).attr("transform", function (d) {
        return "translate (" + d.x + "," + d.y + ")";
      });

      // rescale height nodes
      updateNodes.selectAll("rect.sankeyNode").transition(trans).attr("height", function (d) {
        return d.dy;
      });

      // rescale node infos
      myFrame.selectAll("rect.sankeyNodeInfo").classed("zoomed", false).transition(trans).attr("y", function (d) {
        return d.dy - d.nodeInfos[nodeInfos.nodeInfoKey + "_dy"];
      }).attr("height", function (d) {
        return d.nodeInfos[nodeInfos.nodeInfoKey + "_dy"];
      });

      showSelection(myFrame.selectAll("g.links"), trans); // show links  
      showSelection(myFrame.selectAll("g.node"), trans); // show all nodes
    }

    function hideSelection(sel, trans) {
      sel.transition(trans).style("opacity", 0).on("end", function () {
        d3.select(this).classed("hide", true);return;
      });
    }

    function showSelection(sel, trans) {
      sel.classed("hide", false).transition(trans).style("opacity", 1);
    }

    function transitionYaxis(nameY, thousandsSeparator, percentage, firstSequenceEle) {
      var trans = d3.transition().duration(1000);
      var myFrame = d3.select("g.sankeyFrame.single");
      var dx = d3.select("g.sankeyFrame.single rect.sankeyNode").attr("width") / 2; // position adjustment for text label
      var dy = -5; // height adjustment for text label

      hideSelection(myFrame.selectAll("g.links"), trans); // hide links  
      hideSelection(myFrame.selectAll("g.node").filter(function (d) {
        return d.nameY !== nameY;
      }), trans); // hide not selected nodes

      function getPercentage(d) {
        var label = void 0;
        if (percentage === "%sameTime") {
          label = formatNumber("" + d.value / d.valueXCorr, thousandsSeparator, ",.1%");
        } else if (percentage === "%sameEvent") {
          label = formatNumber("" + d.value / d.valueY, thousandsSeparator, ",.1%");
        } else if (percentage === "%prevEvent") {
          label = formatNumber("" + d.value / d.valueYPrev, thousandsSeparator, ",.1%");
        } else if (percentage === "%firstEvent") {
          label = formatNumber("" + d.value / d.valueYFirst, thousandsSeparator, ",.1%");
        }
        return label;
      }

      myFrame.selectAll("g.node").filter(function (d) {
        return d.nameY === nameY;
      }).append("text").attr("class", "percentageLabel").attr("x", function (d) {
        var x = firstSequenceEle === d.nameX ? 2 : dx;
        return x + "px";
      }).attr("y", dy + "px").text(getPercentage).style("text-anchor", function (d) {
        return firstSequenceEle === d.nameX ? "left" : "middle";
      }).transition(trans).style("opacity", 1);
    }

    function transitionYaxisBack() {
      var myFrame = d3.select("g.sankeyFrame.single");
      var trans = d3.transition().duration(1000);

      showSelection(myFrame.selectAll("g.links"), trans); // show links  
      showSelection(myFrame.selectAll("g.node"), trans); // show all nodes
      hideSelection(d3.selectAll("text.percentageLabel"), trans); // hide labels
    }

    // start Particles - idea from https://bl.ocks.org/emeeks/21f99959d48dd0d0c746

    function particles() {
      var publicAPI = function publicAPI() {};
      var allPaths = [];
      var cw = void 0; // canvas width
      var ch = void 0; // canvas height
      var frequencyScale = void 0;
      var myTimer = {};
      var particleSpeed = void 0;
      var particleShape = void 0;
      var particleSize = void 0;
      var pathName = void 0;
      var svgPaths = void 0;
      var context = void 0;
      var canvasTranslate = void 0;
      var nodeWidth = void 0;
      var debugOn = void 0;

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
        _debugOn: debug option true or false
      */
      publicAPI.init = function (_svgPaths, _canvasTL, _pathName, _myPath, _sequenceStart, _linkMax, _linkValue, _particleMin, _particleMax, _particleSpeed, _particleShape, _particleSize, _nodeWidth, _debugOn) {

        if (d3.select("div.sankeyChart").selectAll("canvas").size() === 0) {
          initializeCanvas(_canvasTL, _linkMax, _particleMin, _particleMax, _particleSpeed, _particleShape, _particleSize, _nodeWidth, _debugOn);
        }

        var pathExists = false;
        allPaths.forEach(function (d) {
          if (d.pathName === _pathName) {
            pathExists = true;
          }
        });

        if (!pathExists) {
          initializeAllPaths(_svgPaths, _pathName, _myPath, _sequenceStart, _linkValue);
        }
        return publicAPI;
      };

      publicAPI.start = function () {
        if (Object.keys(myTimer).length === 0) {
          myTimer = d3.timer(tick);
        }
        return publicAPI;
      };

      publicAPI.stop = function (_pathName) {
        if (typeof _pathName === "undefined") {
          stopParticles();
        }

        var pathExists = false;
        var index = -1;

        allPaths.forEach(function (d, i) {
          if (d.pathName === _pathName) {
            pathExists = true;index = i;
          }
        });

        if (pathExists) {
          if (allPaths.length === 1) {
            stopParticles();
          } // last path
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

      function initializeCanvas(_canvasTranslate, _linkMax, _particleMin, _particleMax, _particleSpeed, _particleShape, _particleSize, _nodeWidth, _debugOn) {
        particleSpeed = _particleSpeed;
        particleShape = _particleShape;
        particleSize = _particleSize;
        debugOn = _debugOn;
        canvasTranslate = _canvasTranslate;
        nodeWidth = _nodeWidth;
        allPaths.remove = -1;
        frequencyScale = d3.scaleLinear().domain([1, _linkMax]).range([_particleMin, _particleMax]);
        cw = d3.select("div.sankeyChart svg").attr("width");
        ch = d3.select("div.sankeyChart svg").attr("height");

        d3.select("div.sankeyChart").insert("canvas", ":first-child").attr("width", cw).attr("height", ch).attr("class", "particles");

        if (debugOn) {
          console.log("canvas (width, height): (" + cw + ", " + ch + ")");
          console.log("canvas translate(x, y): (" + _canvasTranslate.x + ", " + _canvasTranslate.y + ")");
        }
        context = d3.select("canvas").node().getContext("2d");
        context.clearRect(0, 0, cw, ch);
        context.translate(_canvasTranslate.x, _canvasTranslate.y);

        d3.selectAll("g.sankeyFrame.single rect.sankeyNode").each(function (d) {
          d.color = d3.select(this).style("fill");
          d.alpha = d3.select(this).style("fill-opacity");
        });
      }

      function initializeAllPaths(_svgPaths, _pathName, myPath, _sequenceStart, _linkValue) {
        var myLink = void 0;
        var myLinks = [];
        pathName = _pathName;
        svgPaths = _svgPaths;

        svgPaths.forEach(function (svgPath) {
          var link = d3.select(svgPath).datum();
          myPath.forEach(function (ele) {
            if (ele.sx === link.source.nameX && ele.sy === link.source.nameY && ele.tx === link.target.nameX && ele.ty === link.target.nameY) {
              // this link is part of path
              myLink = {};
              myLink.freq = _linkValue === undefined ? frequencyScale(link.value) : frequencyScale(_linkValue);
              myLink.dy = link.dy;
              myLink.particleSize = 2.5 * particleSize;
              myLink.particleColor = d3.scaleLinear().domain([0, 1]).range([link.source.color, link.target.color]);
              myLink.particleAlpha = d3.scaleLinear().domain([0, 1]).range([link.source.alpha, link.target.alpha]);
              myLink.sourceX = link.source.nameX;
              myLink.sourceY = link.source.nameY;
              myLink.svgPath = svgPath;
              myLinks.push(myLink);
            }
          });
        });
        var thisPath = {};
        thisPath["pathName"] = pathName;
        thisPath["sequenceStart"] = _sequenceStart;
        thisPath["links"] = myLinks;
        thisPath["particles"] = [];

        allPaths.push(thisPath);
      }

      function tick(elapsed) {
        if (allPaths.remove !== -1) {
          allPaths.splice(allPaths.remove, 1);
          allPaths.remove = -1;
        }

        allPaths.forEach(function (_path) {
          _path["particles"].forEach(function (d) {
            if (d.current >= d.path.getTotalLength()) {
              _path["links"].filter(function (l) {
                return d.path.__data__.target.nameX === l.sourceX && d.path.__data__.target.nameY === l.sourceY;
              } // just links starting at that node
              ).forEach(function (l) {
                if (d.current - d.path.getTotalLength() <= nodeWidth) {
                  // continue moving upon node
                  d.current = 0;
                  d.diffToNextY = l.svgPath.getPointAtLength(0).y + d.offsetFactor * l.dy - (d.lastPosition.y + d.offsetFactor * d.link.dy);
                  d.node = true;
                } else {
                  // follow new path
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

          _path["particles"] = _path["particles"].filter(function (d) {
            return d.current < d.path.getTotalLength();
          });

          _path["links"].filter(function (d) {
            return _path["sequenceStart"] === d.sourceX;
          }).forEach(function (d) {
            var factor = Math.random() - .5;
            if (Math.random() < d.freq) {
              var offset = factor * d.dy;
              var lastPos = d.svgPath.getPointAtLength(d.svgPath.getTotalLength());
              _path["particles"].push({ link: d, time: elapsed, offset: offset, offsetFactor: factor,
                path: d.svgPath, node: false, lastPosition: lastPos, diffToNextY: 0 });
            }
          });
        });

        particleEdgeCanvasPath(elapsed);
      }

      function particleEdgeCanvasPath(elapsed) {

        context.clearRect(0, 0, cw, ch);
        context.lineWidth = "1px";

        allPaths.forEach(function (_path) {
          var particles = _path["particles"];
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
              currentPos.y = currentPos.y + partOfNode / nodeWidth * particles[x].diffToNextY;
            } else {
              currentPos = particles[x].path.getPointAtLength(particles[x].current);
              relativePos = particles[x].current / particles[x].path.getTotalLength();
            }
            if (debugOn) {
              console.log("current Position: (" + currentPos.x + ", " + currentPos.y + ")");
              console.log("current Position with offset [" + particles[x].offset + "]: (" + currentPos.x + ", " + (currentPos.y + particles[x].offset) + ")");
            }

            context.fillStyle = particles[x].link.particleColor(relativePos);
            context.globalAlpha = particles[x].link.particleAlpha(relativePos);

            if (particleShape === "circle") {
              context.beginPath();
              context.arc(currentPos.x, currentPos.y + particles[x].offset, particles[x].link.particleSize, 0, 2 * Math.PI);
              context.closePath();
              context.fill();
            } else if (particleShape === "person") {
              drawPerson(context, currentPos.x, currentPos.y + particles[x].offset);
            }
          }
        });
      }

      function drawPerson(context, x, y) {
        var factor = 0.05 * particleSize;
        context.translate(-653 * factor, -768 * factor);
        context.translate(x + canvasTranslate.x, y + canvasTranslate.y);
        context.scale(factor, factor);
        context.save();
        context.translate(294.11, 29.495);
        context.beginPath();
        context.moveTo(315.67, 347.53);
        context.bezierCurveTo(315.67, 368.03299999999996, 299.04900000000004, 384.65299999999996, 278.547, 384.65299999999996);
        context.bezierCurveTo(258.04400000000004, 384.65299999999996, 241.42400000000004, 368.032, 241.42400000000004, 347.53);
        context.bezierCurveTo(241.42400000000004, 327.027, 258.045, 310.407, 278.547, 310.407);
        context.bezierCurveTo(299.05, 310.407, 315.67, 327.02799999999996, 315.67, 347.53);
        context.closePath();
        context.fill();
        context.stroke();

        context.restore();
        context.stroke();
        context.beginPath();
        context.moveTo(516.35, 490.41);
        context.bezierCurveTo(516.35, 490.41, 486.011, 647.94, 479.47900000000004, 658.6);
        context.bezierCurveTo(473.89250000000004, 667.7154, 430.29900000000004, 739.242, 430.29900000000004, 739.242);
        context.bezierCurveTo(420.99250000000006, 754.502, 429.81161000000003, 765.4119999999999, 439.67140000000006, 771.1039999999999);
        context.bezierCurveTo(448.06520000000006, 775.9495999999999, 466.1084000000001, 774.7497999999999, 472.0744000000001, 764.5739);
        context.bezierCurveTo(472.0744000000001, 764.5739, 520.4404000000001, 689.3069, 525.7174000000001, 673.0739);
        context.bezierCurveTo(529.3708000000001, 661.8359, 537.8604000000001, 615.2169, 537.8604000000001, 615.2169);
        context.bezierCurveTo(537.8604000000001, 615.2169, 584.8564000000001, 663.6869, 590.0034000000002, 672.3599);
        context.bezierCurveTo(596.4910000000002, 683.2929, 608.5744000000002, 759.5029000000001, 608.5744000000002, 759.5029000000001);
        context.bezierCurveTo(611.4642000000002, 773.0629, 624.3964000000002, 777.4849, 637.8604000000003, 775.2169000000001);
        context.bezierCurveTo(648.4934000000003, 773.4261000000001, 659.6134000000003, 766.2318000000001, 657.1464000000003, 753.0739000000001);
        context.bezierCurveTo(657.1464000000003, 753.0739000000001, 646.4004000000003, 664.7139000000001, 637.8604000000003, 650.2139000000001);
        context.bezierCurveTo(627.6694000000002, 632.9119000000001, 572.8604000000003, 573.7849000000001, 572.8604000000003, 573.7849000000001);
        context.lineTo(588.5744000000003, 503.7849000000001);
        context.bezierCurveTo(588.5744000000003, 503.7849000000001, 598.6604000000003, 524.2309000000001, 605.7174000000003, 533.0709000000002);
        context.bezierCurveTo(613.7429000000003, 543.1239000000002, 664.2884000000004, 572.3569000000002, 664.2884000000004, 572.3569000000002);
        context.bezierCurveTo(668.9247000000004, 575.4666000000002, 679.4214000000004, 573.7531000000002, 683.5744000000004, 565.9283000000003);
        context.bezierCurveTo(686.9076000000005, 559.6477000000002, 686.7507000000004, 549.4743000000003, 679.2887000000004, 544.4993000000003);
        context.bezierCurveTo(679.2887000000004, 544.4993000000003, 637.6337000000004, 518.3483000000003, 627.8597000000004, 510.2133000000003);
        context.bezierCurveTo(616.9897000000004, 501.1833000000003, 594.9997000000004, 440.9433000000003, 594.9997000000004, 440.9433000000003);
        context.bezierCurveTo(588.1789000000005, 431.5569000000003, 578.8487000000005, 421.2013000000003, 562.8567000000004, 420.9433000000003);
        context.bezierCurveTo(546.7377000000004, 420.6830200000003, 538.6697000000004, 429.5629000000003, 531.4277000000004, 434.51430000000033);
        context.bezierCurveTo(531.4277000000004, 434.51430000000033, 469.6807000000004, 479.61930000000035, 463.57070000000044, 488.80030000000033);
        context.bezierCurveTo(457.4238000000004, 498.0363000000003, 446.4277000000004, 567.3713000000004, 446.4277000000004, 567.3713000000004);
        context.bezierCurveTo(444.70410000000044, 575.2713000000003, 447.7898000000004, 581.6243000000004, 457.1417000000004, 583.8003000000003);
        context.bezierCurveTo(468.5847000000004, 586.4623000000004, 476.7867000000004, 579.3369000000004, 477.8557000000004, 573.8003000000003);
        context.bezierCurveTo(477.8557000000004, 573.8003000000003, 484.9065000000004, 519.0353000000003, 489.99870000000044, 510.94330000000036);
        context.bezierCurveTo(495.92750000000046, 501.52190000000036, 516.3447000000004, 490.42230000000035, 516.3447000000004, 490.42230000000035);
        context.closePath();
        context.fill();
        context.stroke();
        context.setTransform(1, 0, 0, 1, 0, 0);
      }

      return publicAPI;
    }

    function sankeySeqExplorer (_myData) {
      "use strict";

      // 0.1 All options not accessible to caller 

      var file; // reference to data (embedded or in file)
      var nodeFile; // optional file with additional node infos
      var pathFile; // optional file with paths
      var nodeInfoKeys; // the key names of the additional node infos
      var nodeInfoNone = "(none)"; // displayed string for no info key
      var nodeInfoKey = nodeInfoNone; // the selected key
      var nodeInfos = {}; // Object containing the three variables above as properties 
      var valueName; // the column name of the frequency value
      var scaleGlobal = true; // scale the node height for multiples over all sankeys 
      var showNodeLabels = true; // show node labels
      var percentages = ["%sameTime"]; // (default) format of the tooltip text
      var allGraphs; // data structure containing columns of rows of sankey input data;
      var tooltip;
      var SINGLE = 1; // single sankey diagram
      var MULTIPLES = 2; // small multiples diagramm
      var ZOOMX = 3; // transitioned to a zoomed display of fractions on x axis
      var ZOOMY = 4; // transitioned to a zoomed display of fractions on y axis
      var visMode = MULTIPLES;
      var classPaths = d3.map(); // maps the class (e.g."f col-row") of g.sankeyFrame to its paths. for particles
      var pathsArray = void 0; // arry of paths for classPaths;
      var props; // properties calculated in initialization function
      var myParticles = particles();

      ///////////////////////////////////////////////////
      // 1.0 add visualization specific variables here //
      ///////////////////////////////////////////////////

      // 1.1 All options that should be accessible to caller  
      var debugOn = false,
          nodeWidth = 15,
          nodePadding = 8,
          size = [700, 500],
          margin = { left: 5, top: 5, right: 5, bottom: 5 },
          sequence,
          categories,
          colOrder,
          rowOrder,
          corrCategories = function corrCategories() {
        return categories;
      },
          // subset of categories for calculating percentages (tooltip, transitions) 
      sequenceName = "sequence",
          categoryName = "category",
          thousandsSeparator = ",",
          particleMin = 0.05,
          particleMax = 0.5,
          particleSpeed = 0.1,
          particleSize = 1,
          particleShape = "circle",
          particleShapeArray = ["circle", "person"];

      // 1.2 all updatable functions to be called by getter-setter methods  
      // var updateNodeInfo;

      ////////////////////////////////////////////////////
      // 2.0 API for external access                    //
      //////////////////////////////////////////////////// 

      // standard API for selection.call(my_reUsableChart)
      function chartAPI(selection) {
        selection.each(function (d) {
          console.log(d);
          console.log("_myData " + _myData);
          if (typeof d !== "undefined") {
            // data processing from outside
            createChart(selection, d);
          } else {
            // data processing here
            if (typeof _myData !== "undefined") {
              readData(_myData, selection);
            } else {
              readData("<pre>", selection);
            }
          }
        });
      }

      // API - example for getter-setter method
      // 2.1 add getter-setter  methods here
      // categories have been renamed to be events to the outside caller

      chartAPI.debugOn = function (_) {
        if (!arguments.length) return debugOn;
        debugOn = _;
        return chartAPI;
      };

      chartAPI.size = function (_) {
        if (!arguments.length) return size;
        size = _;
        return chartAPI;
      };

      chartAPI.margin = function (_) {
        if (!arguments.length) return margin;
        margin.left = _;
        margin.top = _;
        margin.right = _;
        margin.bottom = _;
        return chartAPI;
      };

      chartAPI.nodeWidth = function (_) {
        if (!arguments.length) return nodeWidth;
        nodeWidth = +_;
        return chartAPI;
      };

      chartAPI.nodePadding = function (_) {
        if (!arguments.length) return nodePadding;
        nodePadding = +_;
        return chartAPI;
      };

      chartAPI.sequenceOrder = function (_) {
        if (!arguments.length) return sequence;
        sequence = _;
        return chartAPI;
      };

      chartAPI.eventOrder = function (_) {
        if (!arguments.length) return categories;
        categories = _;
        return chartAPI;
      };

      chartAPI.sequenceName = function (_) {
        if (!arguments.length) return sequenceName;
        sequenceName = _;
        return chartAPI;
      };

      chartAPI.eventName = function (_) {
        if (!arguments.length) return categoryName;
        categoryName = _;
        return chartAPI;
      };

      chartAPI.valueName = function (_) {
        if (!arguments.length) return valueName;
        valueName = _;
        return chartAPI;
      };

      chartAPI.thousandsSeparator = function (_thousandsSeparator) {
        if (!arguments.length) return thousandsSeparator;
        thousandsSeparator = _thousandsSeparator;
        return chartAPI;
      };

      chartAPI.scaleGlobal = function (_) {
        if (!arguments.length) return scaleGlobal;
        scaleGlobal = _;
        return chartAPI;
      };

      chartAPI.showNodeLabels = function (_) {
        if (!arguments.length) return showNodeLabels;
        showNodeLabels = _;
        return chartAPI;
      };

      chartAPI.percentages = function (_) {
        if (!arguments.length) return percentages;
        percentages = _;
        return chartAPI;
      };

      chartAPI.rowOrder = function (_) {
        if (!arguments.length) return rowOrder;
        rowOrder = _;
        return chartAPI;
      };

      chartAPI.colOrder = function (_) {
        if (!arguments.length) return colOrder;
        colOrder = _;
        return chartAPI;
      };

      chartAPI.particleMin = function (_) {
        if (!arguments.length) return particleMin;
        particleMin = _;
        return chartAPI;
      };

      chartAPI.particleMax = function (_) {
        if (!arguments.length) return particleMax;
        particleMax = _;
        return chartAPI;
      };

      chartAPI.particleSpeed = function (_) {
        if (!arguments.length) return particleSpeed;
        particleSpeed = _;
        return chartAPI;
      };

      chartAPI.particleSize = function (_) {
        if (!arguments.length) return particleSize;
        particleSize = _;
        return chartAPI;
      };

      chartAPI.particleShape = function (_) {
        if (!arguments.length) return particleShape;
        if (particleShapeArray.indexOf(_) !== -1) {
          particleShape = _;
        }
        return chartAPI;
      };

      // returns a function that returns an array of categories 
      // for the transitions and tooltip  
      chartAPI.correspondingEvents = function (_) {
        if (!arguments.length) return corrCategories();
        corrCategories = function corrCategories() {
          return _;
        };
        return chartAPI;
      };

      ////////////////////////////////////
      // 3.0 add private functions here //
      ////////////////////////////////////

      // functions for building the menu
      function displaySankeyMenu(selection) {
        var div1 = selection.append("div").attr("class", "sankeyMenu");

        // options menu
        var divOm = div1.append("div").attr("class", "OptionsMenu");

        divOm.append("div").attr("class", "titleMenu").append("label").text("options");

        if (!(allGraphs.cols === 1 && allGraphs.rows === 1)) {
          var div2 = divOm.append("span").attr("class", "span1").append("input").attr("class", "nodeScaling").attr("type", "checkbox").on("change", updateScaling);

          div2.node().checked = scaleGlobal;

          divOm.select("span.span1").append("label").text("global scale");

          divOm.append("br");
        }

        var div3 = divOm.append("span").attr("class", "span2").append("input").attr("class", "labelOnOff").attr("type", "checkbox").on("change", updateNodeLabels);

        div3.node().checked = showNodeLabels;

        div1.select("span.span2").append("label").text("node labels");

        // node info menu  
        if (typeof nodeFile === "undefined") {
          return;
        }

        if (debugOn) {
          console.log("nodeInfoKeys: ");
          console.log(nodeInfoKeys);
        }
        var divNim = d3.select("div.sankeyMenu").append("div").attr("class", "NodeInfoMenu");

        divNim.append("div").attr("class", "titleMenu").append("label").text("node info");

        divNim = divNim.append("form").selectAll("span").data(nodeInfoKeys).enter().append("span");

        divNim.append("input").attr("type", "radio").attr("name", "menu").attr("value", function (d) {
          return d;
        }).attr("checked", function (d, i) {
          if (i === 0) {
            return "checked";
          }
        }).on("change", function change() {
          nodeInfoKey = this.value;
          nodeInfos.nodeInfoKey = nodeInfoKey;
          console.log("nodeInfokey: " + nodeInfoKey);
          updateNodeInfo();
        });

        divNim.append("label").text(function (d) {
          return d;
        });

        divNim.append("br");
      }

      function displayPathsMenu() {
        // paths info menu  
        if (typeof pathFile === "undefined") {
          return;
        }

        var currentRow = void 0;
        var currentCol = void 0;
        var pathInfoMap = void 0;
        var pathNames = void 0;

        var colRow = getColRowOfSingle();
        currentCol = allGraphs[colRow.col][colRow.row].dimCol;
        currentRow = allGraphs[colRow.col][colRow.row].dimRow;

        if (currentCol === "") {
          currentCol = 0;
        }
        if (currentRow === "") {
          currentRow = 0;
        }

        if (Object.keys(pathFile[0]).length === 8) {
          // cols and rows
          var row = Object.keys(pathFile[0])[5];
          var col = Object.keys(pathFile[0])[6];
          pathInfoMap = d3.nest().key(function (d) {
            return d[row];
          }).key(function (d) {
            return d[col];
          }).key(function (d) {
            return d.name;
          }).object(pathFile);
        } else if (Object.keys(pathFile[0]).length === 7) {
          // rows
          var _row = Object.keys(pathFile[0])[5];
          pathInfoMap = d3.nest().key(function (d) {
            return d[_row];
          }).key(function () {
            return 0;
          }).key(function (d) {
            return d.name;
          }).object(pathFile);
        } else if (Object.keys(pathFile[0]).length === 6) {
          // no rows or columns
          pathInfoMap = d3.nest().key(function () {
            return 0;
          }).key(function () {
            return 0;
          }).key(function (d) {
            return d.name;
          }).object(pathFile);
        } else console.log("Error with number of attributes in paths file!");

        if (typeof pathInfoMap[currentRow] === "undefined") {
          return;
        } else if (typeof pathInfoMap[currentRow][currentCol] === "undefined") {
          return;
        }

        pathNames = Object.keys(pathInfoMap[currentRow][currentCol]);

        if (debugOn) {
          console.log("pathFile: ");
          console.log(pathFile);
        }
        var divPm = d3.select("div.sankeyMenu").append("div").attr("class", "PathsMenu").style("opacity", 0);

        divPm.append("div").attr("class", "titleMenu").append("label").text("show path");

        var div4 = divPm.selectAll("span").data(pathNames).enter().append("span");

        div4.append("input").attr("class", "pathInfo").attr("type", "checkbox").attr("value", function (d) {
          return d;
        }
        //  .attr("checked", function(d, i) { if (i === 0) { return "checked"; } })
        ).on("change", showRemoveParticles);

        div4.append("label").text(function (d) {
          return d;
        });

        div4.append("br");

        var trans = d3.transition().duration(1000);
        d3.select("div.PathsMenu").transition(trans).style("opacity", 1);
      }

      function removePathsMenu() {
        var trans = d3.transition().duration(1000);
        d3.select("div.PathsMenu").transition(trans).style("opacity", 0).remove();
        d3.selectAll("canvas.particles").remove();
      }

      function showRemoveParticles(_pathName) {
        if (!d3.select(this).node().checked) {
          myParticles = myParticles.stop(_pathName);
          console.log("stopped!");
        } else {
          if (d3.select("g.sankeyFrame.single").size() === 0) {
            return;
          }

          var colRow = getColRowOfSingle();
          var keyCol = colRow.col;
          var keyRow = colRow.row;
          var key = d3.select("g.sankeyFrame.single").attr("class").split(" ")[1];

          var myPath = [];
          var sequenceStart;
          var sequenceStartIndex = sequence.length - 1;
          var myPathValue;

          var mySankey = allGraphs[keyCol][keyRow].sankey;
          if (scaleGlobal) {
            mySankey.maxValue(allGraphs.maxValue);
          } else {
            mySankey.maxValue(-1);
          }

          pathFile.forEach(function (ele) {
            if (ele.name === _pathName) {
              myPath.push({ sx: ele.sourceX, sy: ele.sourceY, tx: ele.targetX, ty: ele.targetY });
              if (!myPathValue) {
                myPathValue = +ele.value;
              }
              if (sequence.indexOf(ele.sourceX) < sequenceStartIndex) {
                sequenceStartIndex = sequence.indexOf(ele.sourceX);
              }
            }
          });
          sequenceStart = sequence[sequenceStartIndex];

          if (debugOn) {
            console.log(myPath);
            console.log(myPathValue);
          }
          myParticles = myParticles.init(classPaths.get(key), props.particleStart, _pathName, myPath, sequenceStart, mySankey.maxValue(), myPathValue, particleMin, particleMax, particleSpeed, particleShape, particleSize, nodeWidth, debugOn).start();
        }
        return;
      }

      // method called when menu: options-> global scaling is changed  
      function updateScaling() {
        var mySankey;
        var parentSelector;
        var graph;
        var trans = d3.transition().duration(1000);

        scaleGlobal = d3.select(".nodeScaling").node().checked;

        allGraphs.forEach(function (col, colIndex) {
          col.forEach(function (container, rowIndex) {
            mySankey = container.sankey;
            graph = container.graph;

            if (scaleGlobal) {
              mySankey.maxValue(allGraphs.maxValue);
            } else {
              mySankey.maxValue(-1);
            }
            mySankey.layout();

            // transition links
            parentSelector = "g.sankeySeq.s" + colIndex + "-" + rowIndex;
            d3.select(parentSelector).selectAll(".link").data(graph.links, function (d) {
              return d.id;
            } // data join for clarity. Data attributes have been changed even without join!
            ).transition(trans).attr("d", mySankey.link()).style("stroke-width", function (d) {
              return Math.max(1, d.dy) + "px";
            });

            // transition nodes
            d3.select(parentSelector).selectAll(".node").data(graph.nodes).transition(trans).attr("transform", function (d) {
              return "translate(" + d.x + "," + d.y + ")";
            });

            d3.select(parentSelector).selectAll("rect.sankeyNode").transition(trans).attr("height", function (d) {
              return d.dy;
            });

            d3.select(parentSelector).selectAll("text.nodeLabel").transition(trans).attr("y", function (d) {
              // adjustment if text would cross x axis    
              if (debugOn) {
                var transNode = getTranslation(d3.select(this.parentNode).attr("transform"))[1];
                console.log("transform: " + d3.select(this.parentNode).attr("transform"));
                console.log(transNode);
              }
              var pyHeight = parseInt(d3.select(this).style("font-size"));
              return d.dy < pyHeight ? d.dy - pyHeight / 2 - 2 : Math.min(d.dy / 2, d.dy - pyHeight / 2 - 2);
            });

            d3.select(parentSelector).selectAll("rect.sankeyNodeInfo").filter(function (d) {
              nodeInfoKeys.forEach(function (key) {
                if (key !== nodeInfoNone) {
                  // skip case for no nodeInfo selection
                  d.nodeInfos[key + "_dy"] = mySankey.getNodeHeight(+d.nodeInfos[key]);
                } else {
                  if (nodeInfoKey === nodeInfoNone) {
                    d3.selectAll("rect.sankeyNodeInfo").attr("y", function (d) {
                      return d.dy;
                    });
                  }
                }
              });
              return typeof d.nodeInfos !== "undefined";
            }).attr("height", function () {
              return d3.select(this).attr("height");
            }).transition(trans).attr("y", function (d) {
              if (nodeInfoKey === nodeInfoNone) {
                return d.dy;
              } else {
                if (debugOn) {
                  console.log("value: " + +d.nodeInfos[nodeInfoKey]);
                  console.log("newHeight: " + d.nodeInfos[nodeInfoKey + "_dy"]);
                }
                return d.dy - d.nodeInfos[nodeInfoKey + "_dy"];
              }
            }).attr("height", function (d) {
              if (nodeInfoKey === nodeInfoNone) {
                return 0;
              } else {
                return d.nodeInfos[nodeInfoKey + "_dy"];
              }
            });
          });
        });
      }

      function updateNodeLabels() {
        d3.selectAll("text.nodeLabel").style("display", function () {
          return d3.select(".labelOnOff").node().checked ? "block" : "none";
        });
      }

      function updateNodeInfo() {
        var trans = d3.transition().duration(1000);
        var borderCol = d3.select("rect.sankeyNodeInfo").style("fill");
        var backgroundCol = d3.color(borderCol).rgb();
        backgroundCol.opacity = 0.1;
        d3.select("div.NodeInfoMenu").transition(trans).style("border-color", function () {
          return nodeInfoKey === nodeInfoNone ? "rgba(0,0,0,0.1)" : borderCol;
        }).style("background-color", function () {
          return nodeInfoKey === nodeInfoNone ? "rgba(0,0,0,0.1)" : backgroundCol.toString();
        });

        d3.selectAll("rect.sankeyNodeInfo").style("display", "inline" // reset style to inline if switch from none to other
        ).transition(trans).attr("y", function (d) {
          return d3.select(this).classed("zoomed") ? d.nodeInfos[nodeInfoKey + "_transY"] : d.dy - d.nodeInfos[nodeInfoKey + "_dy"];
        }).attr("height", function (d) {
          return d3.select(this).classed("zoomed") ? d.nodeInfos[nodeInfoKey + "_transHeight"] : d.nodeInfos[nodeInfoKey + "_dy"];
        }).transition().delay(10).duration(10).style("display", function () {
          // set style to none if switch from other to none
          if (nodeInfoKey === nodeInfoNone) {
            return "none";
          } else {
            return "inline";
          }
        });
      }

      ////////////////////////////////////////////////////
      // 4.0 add visualization specific processing here //
      //////////////////////////////////////////////////// 

      function createChart(selection) {
        var sankey; // sankeySeq
        var width; // width of drawing area within SVG
        var height; // height of drawing area within SVG
        var sankeyG; // group element containing the sankeySeq graph
        var sankeyF; // group element containing the sankeyFrame = sankeySeq graph + axes/titles
        var node; // selection with nodes
        var graph; // graph for each sankeySeq
        var transformString; // object that transform strings for transitioning between small multiples and single
        var svg;

        selection.each(function () {
          // 4.1 insert code here  
          displaySankeyMenu(selection);

          svg = d3.select(this).append("div").attr("class", "sankeyChart").append("svg").attr("width", size[0]).attr("height", size[1]).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          // drawing axes
          props = initialize_whp_and_axes(svg, size, margin, categories, sequence, nodeWidth);
          if (allGraphs.cols === 1 && allGraphs.rows === 1) {
            d3.selectAll(".axis").style("opacity", 1);
            d3.selectAll(".sankeyNode,.sankeyNodeInfo").style("stroke-width", "1px");
            d3.select("g.sankeyFrame").classed("single", true);
            visMode = SINGLE;
          }
          width = props.width;
          height = props.height;

          if (debugOn) {
            console.log("allGraphs:");console.log(allGraphs);
          }

          allGraphs.forEach(function (col, colIndex) {
            col.forEach(function (container, rowIndex) {
              graph = container.graph;
              if (debugOn) {
                console.log("col: " + container.dimCol);
                console.log("row: " + container.dimRow);
              }

              // setting up sankeySeq
              // sankey = d3.sankeySeq()
              sankey = sankeySeq().size([width, height]).sequence(sequence).categories(categories).nodeWidth(nodeWidth).nodePadding(nodePadding).nodes(graph.nodes).links(graph.links).correspondingCategories(chartAPI.correspondingEvents()).debugOn(debugOn);

              if (scaleGlobal) {
                sankey.maxValue(allGraphs.maxValue);
              }
              sankey.layout().addValues();
              container.sankey = sankey;
              transformString = initializeFrame(svg, props, allGraphs, colIndex, rowIndex);

              d3.select("div.sankeyChart > svg").on("click", function () {
                // after click anywhere in svg, return to single mode
                if (visMode === ZOOMX) {
                  if (d3.select(".nodeScaling").size > 0) {
                    d3.select(".nodeScaling").node().disabled = false;
                  }
                  d3.select(".labelOnOff").node().disabled = false;
                  var nameX = d3.select("g.zoomed").classed("zoomed", false).datum();
                  transitionXaxisBack(corrCategories, nameX, nodeInfos);
                  displayPathsMenu();
                  visMode = SINGLE;
                } else if (visMode === ZOOMY) {
                  if (d3.select(".nodeScaling").size > 0) {
                    d3.select(".nodeScaling").node().disabled = false;
                  }
                  d3.select(".labelOnOff").node().disabled = false;
                  d3.select("g.zoomed").classed("zoomed", false);
                  transitionYaxisBack();
                  displayPathsMenu();
                  visMode = SINGLE;
                }
              });

              sankeyF = svg.append("g").datum(transformString.sankeyFrame
              // .attr("class", "sankeyFrame f" + colIndex + "-" + rowIndex)
              ).attr("class", function () {
                var c = "sankeyFrame f" + colIndex + "-" + rowIndex;
                c += allGraphs.cols === 1 && allGraphs.rows === 1 ? " single" : " multiples";
                return c;
              }).attr("transform", transformString.sankeyFrame.multiples).on("click", function () {
                if (!(allGraphs.cols === 1 && allGraphs.rows === 1)) {
                  if (visMode === MULTIPLES) {
                    transitionToSingle(this);
                    displayPathsMenu();
                    visMode = SINGLE;
                  } else if (visMode === SINGLE) {
                    transitionToMultiples(this);
                    removePathsMenu();
                    visMode = MULTIPLES;
                  }
                }
              });

              sankeyG = sankeyF.append("g").datum(transformString.sankeySeq).attr("class", "sankeySeq s" + colIndex + "-" + rowIndex).attr("transform", transformString.sankeySeq.multiples);

              var topP = sankeyF.append("g").datum(transformString.pTop).attr("class", "sankeyPad multiples pTop").attr("transform", transformString.pTop.multiples);

              topP.append("text").attr("class", "multiples col c" + colIndex).text(function () {
                var topLabel = ""; // for single Sankey no title
                if (allGraphs.cols === 1 && allGraphs.rows > 1) {
                  topLabel = container.dimRow;
                } // switch label to top
                else {
                    topLabel = container.dimCol;
                  }
                return topLabel;
              });

              topP.append("text").attr("class", "single col c" + colIndex).style("opacity", 0).text(function () {
                var topLabel = ""; // for single Sankey no title
                if (allGraphs.cols === 1 && allGraphs.rows > 1) {
                  topLabel = container.dimRow;
                } // switch label to top
                else {
                    topLabel = container.dimRow + "\xA0\xA0\xA0\xA0" + container.dimCol;
                  }
                return topLabel;
              });

              sankeyF.append("g").datum(transformString.pLeft).attr("class", "sankeyPad multiples pLeft").attr("transform", transformString.pLeft.multiples).append("text").attr("class", "multiples row r" + rowIndex).attr("transform", "rotate(-90)").text(function () {
                var topLabel = ""; // for single Sankey and one dimension no title
                if (allGraphs.cols > 1 && allGraphs.rows > 1) {
                  topLabel = container.dimRow;
                }
                return topLabel;
              });

              // rect as selection area
              sankeyG.append("rect").attr("class", "coverSankeySeq").attr("height", height).attr("width", width + 2 // otherwise global scale transition leads to stroke rendering issues on the rightmost nodes 
              ).style("stroke", "black").style("stroke-width", 1).style("fill-opacity", 0);

              // tooltip
              tooltip = d3.select("body").append("div").attr("class", "tooltip");

              // drawing links
              sankeyG.append("g").attr("class", "links").selectAll(".link").data(graph.links).enter().append("path").attr("class", function (d) {
                return "link" + " lsx" + d.source.nameX.replace(/ /g, "_") + " lsy" + d.source.nameY.replace(/ /g, "_") + " ltx" + d.target.nameX.replace(/ /g, "_") + " lty" + d.target.nameY.replace(/ /g, "_");
              }).attr("d", sankey.link()).style("stroke-width", function (d) {
                return Math.max(1, d.dy) + "px";
              }).sort(function (a, b) {
                return b.dy - a.dy;
              }).each(function (d, i, nodes) {
                if (i === 0) {
                  pathsArray = [];
                }
                pathsArray.push(this);
                if (i === nodes.length - 1) {
                  classPaths.set("f" + colIndex + "-" + rowIndex, pathsArray);
                }
              }).on("mouseover", function (d) {
                var info = sequenceName + ": " + d.source.nameX + " \u21FE " + d.target.nameX;
                info += "<br>" + categoryName + ": " + d.source.nameY + " \u21FE " + d.target.nameY;
                info += "<br>" + valueName + ": " + formatNumber(d.value, thousandsSeparator, ",.0f");
                tooltip.html(info);
                tooltip.style("visibility", "visible");
              }).on("mousemove", function () {
                var twidth = 19; // padding + border + 5
                var theight = 19; // padding + border + 5

                var index = tooltip.style("width").indexOf("px");
                if (index != -1) twidth += +tooltip.style("width").substr(0, index);

                index = tooltip.style("height").indexOf("px");
                if (index != -1) theight += +tooltip.style("height").substr(0, index);

                var top = d3.event.pageY - 100 < 0 ? d3.event.pageY + 23 : d3.event.pageY - theight;
                var left = d3.event.pageX + 250 < window.innerWidth ? d3.event.pageX + 5 : d3.event.pageX - twidth;

                return tooltip.style("top", top + "px").style("left", left + "px");
              }).on("mouseout", function () {
                return tooltip.style("visibility", "hidden");
              });

              // drawing nodes
              node = sankeyG.append("g").attr("class", "nodes").selectAll(".node").data(graph.nodes).enter().append("g").attr("class", "node").attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
              });

              node.append("rect").attr("class", function (d) {
                var res = "sankeyNode" + " nx" + d.nameX.replace(/ /g, "_") + " ny" + d.nameY.replace(/ /g, "_");
                categories.forEach(function (cat, i) {
                  if (cat === d.nameY) {
                    res += " color" + i % 5;
                  }
                });
                return res;
              }).attr("height", function (d) {
                return d.dy;
              }).attr("width", sankey.nodeWidth()).on("mouseover", function (d) {
                var info = sequenceName + ": " + d.nameX;
                info += "<br>" + categoryName + ": " + d.nameY;
                info += "<br>" + valueName + ": " + formatNumber(d.value, thousandsSeparator, ",.0f");
                percentages.forEach(function (line) {
                  if (line === "%sameTime") {
                    if (corrCategories().length === categories.length) {
                      info += "<br>% of '" + d.nameX + "': " + formatNumber("" + d.value / d.valueX, thousandsSeparator, ",.1%");
                    } else {
                      info += "<br>% of '" + d.nameX + "'(CE): " + formatNumber("" + d.value / d.valueXCorr, thousandsSeparator, ",.1%");
                    }
                  } else if (line === "%sameEvent") {
                    info += "<br>% of '" + d.nameY + "': " + formatNumber("" + d.value / d.valueY, thousandsSeparator, ",.1%");
                  } else if (line === "%prevEvent") {
                    info += "<br>% of previous '" + d.nameY + "': " + formatNumber("" + d.value / d.valueYPrev, thousandsSeparator, ",.1%");
                  } else if (line === "%firstEvent") {
                    info += "<br>% of first '" + d.nameY + "': " + formatNumber("" + d.value / d.valueYFirst, thousandsSeparator, ",.1%");
                  }
                });
                tooltip.html(info);
                tooltip.style("visibility", "visible");
              }).on("mousemove", function () {
                positionTooltipNode(tooltip);
              }).on("mouseout", function () {
                return tooltip.style("visibility", "hidden");
              });

              // var yOfBottomAxis = parseInt(d3.select("rect.coverSankeySeq").attr("height"));
              node.append("text").attr("class", "nodeLabel").style("display", function () {
                return d3.select(".labelOnOff").node().checked ? "block" : "none";
              }).attr("x", 3 + sankey.nodeWidth()).attr("y", function (d) {
                return d.dy / 2;
              }).attr("dy", ".35em").attr("text-anchor", "start").attr("transform", null).style("opacity", 0).text(function (d) {
                return d.nameY;
              }).each(function () {
                // adjust height for lowest category in case text overlaps with x axis
                if (debugOn) {
                  console.log(d3.select(this.parentNode).node());
                  console.log("transform: " + d3.select(this.parentNode).attr("transform"));
                }
                // var transNode = getTranslation(d3.select(this.parentNode).attr("transform"))[1];
                var pyHeight = parseInt(d3.select(this).style("font-size"));
                d3.select(this).attr("y", function (d) {
                  return d.dy < pyHeight ? d.dy - pyHeight / 2 - 2 : Math.min(d.dy / 2, d.dy - pyHeight / 2 - 2);
                });
              }).filter(function (d) {
                return d.x > width * .9;
              }).attr("x", -3).attr("text-anchor", "end");
              // .attr("transform", function(d) { return "translate (" + ((d.dy / 2) + 30) + "," + (d.dy / 2) + ") rotate(90)"; }); 

              //drawing nodeInfos
              node.filter(function (d) {
                return typeof d.nodeInfos !== "undefined";
              } // display nodeInfos
              ).append("rect").attr("class", "sankeyNodeInfo").attr("y", function (d) {
                return d.dy;
              }).attr("height", function (d) {
                nodeInfoKeys.forEach(function (key) {
                  d.nodeInfos[key + "_dy"] = sankey.getNodeHeight(+d.nodeInfos[key]);
                });
                return 0;
              }).attr("width", sankey.nodeWidth()).style("display", function () {
                // set style to none if nodeInfo == none
                if (nodeInfoKey === nodeInfoNone) {
                  return "none";
                } else {
                  return "inline";
                }
              }).on("mouseover", function (d) {
                var info = sequenceName + ": " + d.nameX;
                info += "<br>" + categoryName + ": " + d.nameY;
                info += "<br>" + valueName + " (" + nodeInfoKey + "): " + formatNumber(d.nodeInfos[nodeInfoKey], thousandsSeparator, ",.0f");
                info += "<br>% of node: " + formatNumber("" + d.nodeInfos[nodeInfoKey] / d.value, thousandsSeparator, ",.1%");
                tooltip.html(info);
                tooltip.style("visibility", "visible");
              }).on("mousemove", function () {
                positionTooltipNode(tooltip);
              }).on("mouseout", function () {
                return tooltip.style("visibility", "hidden");
              });

              if (container.transform === "single") {
                transitionToSingle(sankeyF.node(), d3.transition().duration(0));
              }

              if (allGraphs.cols === 1 && allGraphs.rows === 1) {
                displayPathsMenu();
              }

              d3.selectAll("g.axis.bottom > g.tick").on("click", function (d) {
                if (visMode === SINGLE) {
                  if (skipX(d)) {
                    return;
                  }

                  if (d3.select(".nodeScaling").size > 0) {
                    d3.select(".nodeScaling").node().disabled = true;
                  }
                  d3.select(".labelOnOff").node().checked = false;
                  updateNodeLabels();
                  d3.select(".labelOnOff").node().disabled = true;
                  d3.select(this).classed("zoomed", true);
                  resort(corrCategories);
                  removePathsMenu();
                  transitionXaxis(corrCategories, d, nodeInfos, thousandsSeparator);
                  d3.event.stopPropagation();
                  visMode = ZOOMX;
                }
              });

              d3.selectAll("g.axis.bottom > g.tick").on("mouseover", function (dFirst) {
                if (skipX(dFirst)) {
                  d3.select(this).style("cursor", "default");
                  return;
                }

                d3.select(this).style("cursor", "pointer");
                var bbox = d3.select(this).selectAll("text").node().getBBox();
                var w = bbox.width / 2 + 2;
                var of = 0.5; // offset
                var h = bbox.height;
                var pd = "M" + of + " 0 L" + -(of + w + 3) + " 8 L" + -(of + w) + " 8 L" + -(of + w) + " " + (h + 11);
                pd += " L" + (of + w) + " " + (h + 11) + " L" + (of + w) + " 8 L" + (of + w + 3) + " 8 Z";

                d3.select(this).selectAll("path").data([dFirst], function (d) {
                  return d;
                }).enter().append("path").attr("d", pd);
              }).on("mouseleave", function () {
                d3.select(this).selectAll("path").remove();
                d3.select(this).style("cursor", "default");
              });

              // helper to skip mouse event handling
              function skipX(da) {
                var skipYes = false;
                var cond1 = visMode === ZOOMY || visMode === ZOOMX;
                var numberNodes = d3.select("g.sankeyFrame.single").selectAll("g.node").filter(function (d) {
                  return d.nameX === da;
                });
                var cond2 = numberNodes.size() === 0;
                var numberNodes2 = numberNodes.filter(function (d) {
                  return corrCategories().indexOf(d.nameY) !== -1;
                }).size();
                var cond3 = numberNodes2 === 0;

                skipYes = cond1 || cond2 || cond3;
                return skipYes;
              }

              // in case the specified order of correspondingEvents() does not match eventOrder()
              function resort(_corrCategories) {
                var ar1 = _corrCategories();
                var ar2 = ar1.sort(function (a, b) {
                  return categories.indexOf(a) - categories.indexOf(b);
                });
                _corrCategories = function _corrCategories() {
                  return ar2;
                };
              }

              d3.selectAll("g.axis.left > g.tick").on("click", function (d) {
                if (visMode === SINGLE) {
                  if (skipY(d)) {
                    return;
                  }

                  d3.select(this).classed("zoomed", true);
                  if (d3.select(".nodeScaling").size > 0) {
                    d3.select(".nodeScaling").node().disabled = true;
                  }
                  d3.select(".labelOnOff").node().checked = false;
                  updateNodeLabels();
                  d3.select(".labelOnOff").node().disabled = true;
                  removePathsMenu();
                  transitionYaxis(d, thousandsSeparator, percentages[0], sequence[0]);
                  d3.event.stopPropagation();
                  visMode = ZOOMY;
                }
              });

              d3.selectAll("g.axis.left > g.tick").on("mouseover", function (dFirst) {
                if (skipY(dFirst)) {
                  d3.select(this).style("cursor", "default");
                  return;
                }

                d3.select(this).style("cursor", "pointer");
                var bbox = d3.select(this).selectAll("text").node().getBBox();
                var w = bbox.width;
                var of = bbox.y + bbox.height / 2; // offset
                var h = bbox.height / 2 + 2;
                var pd = "M0 " + of + " L-10 " + (of + h + 3) + " L-10 " + (of + h) + " L" + -(w + 12) + " " + (of + h);
                pd += " L" + -(w + 12) + " " + (of - h) + " L-10 " + (of - h) + " L-10 " + (of - h - 3) + " Z";

                d3.select(this).selectAll("path").data([dFirst], function (d) {
                  return d;
                }).enter().append("path").attr("d", pd);
              }).on("mouseleave", function () {
                d3.select(this).selectAll("path").remove();
                d3.select(this).style("cursor", "default");
              });

              // helper to skip mouse event handling
              function skipY(da) {
                var skipYes = false;
                var cond1 = visMode === ZOOMY || visMode === ZOOMX;
                var numberNodes = d3.select("g.sankeyFrame.single").selectAll("g.node").filter(function (d) {
                  return d.nameY === da;
                }).size();
                var cond2 = numberNodes === 0;
                var cond3 = percentages[0] === "%sameTime" && corrCategories().indexOf(da) === -1;

                skipYes = cond1 || cond2 || cond3;
                return skipYes;
              }
            });
          });
        });
      }

      // 4.2 update functions

      ////////////////////////////////////////////////////
      // 5.0 processing data begins here                //
      //////////////////////////////////////////////////// 

      // 5.1 adjust for visualization specific data processing
      // XHR to load data   
      function readData(csvFile, selection) {
        if (csvFile !== "<pre>") {
          var suffix = csvFile.split(".")[csvFile.split(".").length - 1];
          if (suffix !== "csv" && suffix !== "json") {
            console.log("Wrong suffix (neither csv nor json): " + csvFile);
          } else if (suffix === "json") {
            readJson(csvFile, selection);
          } else {
            readCsv(csvFile, selection);
          }
        } else {
          // data embedded in html file
          if (d3.select("pre#data").size() !== 0) {
            file = d3.csvParse(d3.select("pre#data").text());
          } else {
            console.log("no data found in pre#data!");
          }
          if (d3.select("pre#dataNodes").size() !== 0) {
            var content = d3.select("pre#dataNodes").text();
            if (content !== "") {
              nodeFile = d3.csvParse(content);
            }
          }
          if (d3.select("pre#paths").size() !== 0) {
            var _content = d3.select("pre#paths").text();
            if (_content !== "") {
              pathFile = d3.csvParse(_content);
            }
          }

          if (debugOn) {
            console.log("file: ");
            console.log(file);
            console.log("nodeFile: ");
            console.log(nodeFile);
          }

          if (debugOn) {
            console.log("file: ");
            console.log(file);
            console.log("pathFile: ");
            console.log(pathFile);
          }
          allGraphs = constructSankeyFromCSV(file); // main data structure build from csv file
          createChart(selection);
        }
      }

      // 5.2 reads data from a csv file
      function readCsv(csvFile, selection) {
        d3.csv(csvFile, function (error1, f) {
          var nodeFileName = csvFile.slice(0, csvFile.lastIndexOf(".")) + "_nodes" + csvFile.slice(csvFile.lastIndexOf("."));
          d3.csv(nodeFileName, function (error2, nf) {
            // load infos from optional nodeInfo file
            if (debugOn) {
              console.log("start");
              console.log(error2);
              console.log(nf);
              console.log("end");
            }
            nodeFile = nf;
            file = f;

            if (debugOn) {
              console.log("file: ");
              console.log(file);
              console.log("nodeFileName: ");
              console.log(nodeFileName);
              console.log("nodeFile: ");
              console.log(nodeFile);
            }
            var pathFileName = csvFile.slice(0, csvFile.lastIndexOf(".")) + "_paths" + csvFile.slice(csvFile.lastIndexOf("."));
            d3.csv(pathFileName, function (error3, pf) {
              // load paths from optional show path file
              pathFile = pf;
              if (debugOn) {
                console.log("pathfile error:");
                console.log(error3);
                console.log("pathfile:");
                console.log(pathFile);
                console.log("end");
              }
              allGraphs = constructSankeyFromCSV(file); // main data structure build from csv file           
              createChart(selection);
            });
          });
        });
      }

      // 5.3 reads data from a json file
      function readJson(csvFile, selection) {
        d3.json(csvFile, function (error1, f) {
          if (debugOn) {
            console.log("start");
            console.log(error1);
            console.log(f);
            console.log("end");
          }
          if (!f["data"]) {
            console.log(" --> No data key found in JSON file");
          } else {
            file = f["data"];file.columns = Object.keys(file[0]);
          }

          if (!f["dataNodes"]) {
            console.log(" --> No dataNodes key found in JSON file");
          } else {
            nodeFile = f["dataNodes"];nodeFile.columns = Object.keys(nodeFile[0]);
          }

          if (!f["paths"]) {
            console.log(" --> No paths key found in JSON file");
          } else {
            pathFile = f["paths"];pathFile.columns = Object.keys(pathFile[0]);
          }

          allGraphs = constructSankeyFromCSV(file); // main data structure build from JSON file           
          createChart(selection);
        });
      }

      // 5.4 processes sankey from a csv file. Returns the necessary graph data structure. 
      // based on the approach from timelyportfolio, see http://bl.ocks.org/timelyportfolio/5052095
      function constructSankeyFromCSV(_file) {
        //set up graph in same style as original example but empty
        var graph = {};
        var allGraphs = []; // array of graphs
        var source, target;
        var columns = _file.columns;
        var dataGroups = [];
        var nodeMap = d3.map();
        var hashKey;
        var data; // data from each group (categories of dimension)
        var container;
        var sourceValues, targetValues; // for iterating over value to find maxValue
        var value,
            maxValue = 0; // maxValue for scaling option 
        var sequenceSet = d3.set();
        var categorySet = d3.set();

        console.log(_file.columns);
        if (typeof valueName === "undefined") {
          valueName = _file.columns[0];
        }

        // processing main file first
        if (_file.columns.length === 5) {
          // standard case
          dataGroups = d3.nest().key(function () {
            return "";
          }).key(function () {
            return "";
          }).entries(_file);

          if (typeof nodeFile !== "undefined") {
            nodeFile.forEach(function (node) {
              hashKey = node["sourceX"] + "," + node["sourceY"];
              nodeMap.set(hashKey, node);
              if (debugOn) {
                console.log(node);
              }
            });
            nodeInfoKeys = nodeFile.columns;
            nodeInfoKeys.splice(0, 2, nodeInfoNone);
          }
        } else if (_file.columns.length === 6) {
          // one additional dimension
          dataGroups = d3.nest().key(function () {
            return "";
          }).key(function (d) {
            return d[columns[5]];
          }).sortKeys(orderDimension(rowOrder)).entries(_file);

          if (typeof nodeFile !== "undefined") {
            nodeFile.forEach(function (node) {
              hashKey = node[_file.columns[5]] + "," + node["sourceX"] + "," + node["sourceY"];
              nodeMap.set(hashKey, node);
              if (debugOn) {
                console.log(node);
              }
            });
            nodeInfoKeys = nodeFile.columns;
            nodeInfoKeys.splice(0, 3, nodeInfoNone);
          }
        } else if (_file.columns.length === 7) {
          // two additional dimensions
          dataGroups = d3.nest().key(function (d) {
            return d[columns[6]];
          }).sortKeys(orderDimension(colOrder)).key(function (d) {
            return d[columns[5]];
          }).sortKeys(orderDimension(rowOrder)).entries(_file);

          if (debugOn) {
            console.log("----------- nodeInfos ------------");
          }
          if (typeof nodeFile !== "undefined") {
            nodeFile.forEach(function (node) {
              hashKey = node[_file.columns[6]] + "," + node[_file.columns[5]] + "," + node["sourceX"] + "," + node["sourceY"];
              nodeMap.set(hashKey, node);
              if (debugOn) {
                console.log(node);
              }
            });
            nodeInfoKeys = nodeFile.columns;
            nodeInfoKeys.splice(0, 4, nodeInfoNone);
          }
        }

        allGraphs.rows = d3.nest().key(function (d) {
          return d[columns[5]];
        }).entries(_file).length;

        allGraphs.cols = d3.nest().key(function (d) {
          return d[columns[6]];
        }).entries(_file).length;

        if (debugOn) {
          console.log("----------- datagroups ------------");
          console.log(dataGroups);
          console.log("----------nodeMap----------");
          console.log(nodeMap);
        }

        // create data structure containing data in the right representation    
        dataGroups.forEach(function (dim2, col) {
          allGraphs[col] = [];
          dim2.values.forEach(function (dim1) {
            data = dim1.values;
            graph = { "nodes": [], "links": [] };

            if (debugOn) {
              console.log("graph0: ");
            }

            data.forEach(function (d, i) {
              if (debugOn) {
                console.log("i: " + i);
                console.log(d);
              }

              // data is derived from the hard-coded column order
              source = d[columns[1]] + "_" + d[columns[2]];
              target = d[columns[3]] + "_" + d[columns[4]];
              graph.nodes.push({ "name": source });
              graph.nodes.push({ "name": target });
              graph.links.push({ "source": source,
                "target": target,
                "id": source + "->" + target,
                "value": +d[columns[0]] });

              // build sets for sequence and categories
              sequenceSet.add(d[columns[1]]);
              sequenceSet.add(d[columns[3]]);
              categorySet.add(d[columns[2]]);
              categorySet.add(d[columns[4]]);
            });

            if (debugOn) {
              console.log("graph1: ");
              console.log(JSON.stringify(graph));
            }

            graph.nodes = d3.nest().key(function (d) {
              return d.name;
            }).map(graph.nodes).keys();

            if (debugOn) {
              console.log("graph2: ");
              console.log(JSON.stringify(graph));
            }

            // loop through each link replacing the text with its index from node
            graph.links.forEach(function (d, i) {
              graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
              graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
            });

            //now loop through each node to make nodes an array of objects
            // rather than an array of strings
            graph.nodes.forEach(function (d, i) {
              var xValue = d.split("_")[0];
              var yValue = d.split("_")[1];
              graph.nodes[i] = { "name": d, "nameX": xValue, "nameY": yValue };

              // add nodeInfos if available
              var nInfos;
              var firstPart = dim2.key === "" ? "" : dim2.key + ",";
              var secondPart = dim1.key === "" ? "" : dim1.key + ",";
              nInfos = nodeMap.get(firstPart + secondPart + xValue + "," + yValue);

              if (typeof nInfos !== "undefined") {
                Object.keys(nInfos).forEach(function (key) {
                  nInfos[key + "_dy"] = 0;
                });
                nInfos[nodeInfoNone] = 0; // add this for later processing convenience
                graph.nodes[i].nodeInfos = nInfos;
              }
            });

            if (debugOn) {
              console.log("graph 3");
              console.log(JSON.stringify(graph));
              console.log(graph);
            }

            if (debugOn) {
              console.log("categoriesSorted: ");
              console.log(categories);
            }

            container = {};
            container.graph = graph;

            container.dimRow = dim1.key;
            container.dimCol = dim2.key;

            // computing the value of the largest node
            sourceValues = d3.nest().key(function (d) {
              return d.source;
            }).rollup(function (values) {
              return d3.sum(values, function (d) {
                return +d.value;
              });
            }).entries(graph.links);

            targetValues = d3.nest().key(function (d) {
              return d.target;
            }).rollup(function (values) {
              return d3.sum(values, function (d) {
                return +d.value;
              });
            }).entries(graph.links);

            sourceValues = sourceValues.concat(targetValues);
            value = d3.max(sourceValues, function (d) {
              return d.value;
            });

            maxValue = value > maxValue ? value : maxValue;

            if (allGraphs.cols === 1 && allGraphs.rows === 1) {
              container.transform = "single";
            } // standard case
            else {
                container.transform = "multiples";
              } // additional dimensions

            allGraphs[col].push(container);
          });
        });

        // assemble nodeInfos object for transitions
        nodeInfos.nodeInfoKeys = nodeInfoKeys;
        nodeInfos.nodeInfoNone = nodeInfoNone;
        nodeInfos.nodeInfoKey = nodeInfoKey;

        // get array of sequence and categories from sets
        var d_sequence = sequenceSet.values().sort(d3.ascending);
        var d_categories = categorySet.values().sort(d3.ascending);

        // output sequence and categories for debugging
        console.log(" data sequence: " + d_sequence);
        if (sequence) {
          console.log("input sequence: " + sequence);
        } else {
          sequence = d_sequence;
        }
        console.log(" data categories: " + d_categories);
        if (categories) {
          console.log("input categories: " + categories);
        } else {
          categories = d_categories;
        }

        if (debugOn) {
          console.log("maxValue: " + maxValue);
        }
        allGraphs.maxValue = maxValue;
        return allGraphs;
      }
      return chartAPI;
    }

    exports.chart = sankeySeqExplorer;

    Object.defineProperty(exports, '__esModule', { value: true });

}));