var expect = require('expect.js');
var collect = require('../src/varCollector');
var esprima = require('esprima');

var external1 = 1, external2 = 2, external3 = "3", external4 = function() {}, external5 = {}, external6 = "toString";
function external7() {}

//this function has different types of blocks and uses both internal and external vars
function view(arg1, arg2) {
    var internal1 = 3, internal3, internal10 = {internal11: external7()};
    for (var internal2 = 1; internal2 < external1; internal2++) {}
    var internalFn = function internalFn(internalFnArg1) {
        console.log(internalFnArg1);
    }
    while (internal3 != external3) {
        try {

        }
        catch (internalException) {
            external2 = Math.random() > 0.5 ? external4() : external5[external6]();
        }
    }
}


describe("var collector", function () {

    it("shall return only variable names not declared inside", function () {
        var parsed = esprima.parse(view.toString());
        expect(collect(parsed).sort()).to.eql([
            "Math", "console", "external1", "external2", "external3", "external4", "external5", "external6", "external7"
        ])

    })

});