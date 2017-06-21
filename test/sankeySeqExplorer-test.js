var tape = require("tape");
var seq = require("../");

tape("test Seq explorer intialization", function(test) {
  test.equal( false, seq.chart().debugOn());
  test.deepEqual( [700, 500], seq.chart().size());
  test.end();
}); 

/*
// adjust index.js to include helper.js
tape("test thousands formatter", function(test) {
  let num = seq.formatNumber("200144", ".");
  test.equal( num, "200.144");
  num = seq.formatNumber("200144", ",");
  test.equal( num, "200,144");
  test.end();
}); 
*/

