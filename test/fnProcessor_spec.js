var expect = require('expect.js');
var process = require('../src/fnProcessor');
var esprima = require('esprima');
var escodegen = require('escodegen');

var BODY = " var nameE; " +
    "    function nameA() { return 1; }" +
    "    function nameB() {'__attribute_B'; return 2;}" +
    "    var object = {" +
    "        nameC: function() {return 3;}," +
    "        nameD: function(argD) {return 4;}" +
    "    };" +
    "    nameE = function() { return 5; };" +
    "    nameE.prototype.nameF = function() { return 6; }";

describe("fn processor", function() {

    var parsed = esprima.parse(BODY);

    it("shall provide corrent fn names", function () {
        var names = [];
        process(parsed, function (fn) {
            names.push(fn.name);
        });
        expect(names).to.eql(["nameA", "nameB", "nameC", "nameD", "nameE", "nameF"]);

    });
    it("shall provide correct fn attributes", function () {
        var attrs = [];
        process(parsed, function (fn) { attrs.push(fn.attribute); });
        expect(attrs).to.eql([null, "__attribute_B", null, null, null, null]);
    });
    it("shall provide correct argument names", function () {
        var args = [];
        process(parsed, function (fn) { args.push(fn.paramNames); });
        expect(args).to.eql([[], [], [], ["argD"], [], []]);
    });
    it("shall provide correct body", function () {
        var bodies = [];
        process(parsed, function (fn, body) { bodies.push(escodegen.generate(body, {format: {compact: true}})); });
        expect(bodies).to.eql(["{return 1;}", "{'__attribute_B';return 2;}", "{return 3;}", "{return 4;}", "{return 5;}", "{return 6;}"]);
    });
    it("shall replace body", function () {
        process(parsed, function (fn, body, replace) {
            replace({type: "Literal", value: fn.name});
        });
        var bodies = [];
        process(parsed, function (fn, body) { bodies.push(escodegen.generate(body, {format: {compact: true}})); });
        expect(bodies).to.eql(["{'nameA'}", "{'nameB'}", "{'nameC'}", "{'nameD'}", "{'nameE'}", "{'nameF'}"]);

    })
})