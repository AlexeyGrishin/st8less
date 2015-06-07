var expect = require('expect.js');
var Splitter = require('../src/exractor');
var esprima = require('esprima');
var escodegen = require('escodegen');

var File1 = "var Page1 = {" +
    "    controller: function () {" +
    "        this.count = 5;" +
    "    }," +
    "    view: function (c) {" +
    "        '__stateless';" +
    "        return m('div', 'count is ' + c.count);" +
    "    }" +
    "};";

var File2 = "function myRand() {" +
    "    '__stateless';" +
    "    return Math.random();" +
    "};";

describe("splitter", function () {

    function split2files(options, file1, file2, cb) {
        var splitter = new Splitter(options);
        var rf1, rf2, rfs;
        splitter.parse(file1, function (err, res) {
            if (err) throw err;
            rf1 = res;
        });
        splitter.parse(file2, function (err, res) {
            if (err) throw err;
            rf2 = res;
        });
        splitter.done(function (err, res) {
            if (err) throw err;
            rfs = res;
        });
        cb(rf1, rf2, rfs);

    }

    var resFile1, resFile2, resStateless;
    var OPTS = {globalName: "MyGlobal", append: "MyGlobal.done = true;", objectName: "abc"};

    it("shall process 2 files without error", function () {
        "use strict";
        split2files(OPTS, File1, File2, function (rf1, rf2, rs) {
            resFile1 = rf1;
            resFile2 = rf2;
            resStateless = rs;
            console.log(File1, "\n\n", File2, "\n\n",  resFile1, "\n\n", resFile2, "\n\n", resStateless);
        })
    });
    it("shall be executable after splitting", function () {
        var allTogether = ["var MyGlobal = {};", resFile1, resFile2, resStateless, "return MyGlobal;"].join("\n");
        var fn = new Function(allTogether);
        var globalObj = fn();
        expect(globalObj.done).to.be.ok();
        expect(globalObj.abc).to.be.ok();
        expect(Object.keys(globalObj.abc).length).to.be(2);
    });
    it("shall change only stateless file if stateless function changed", function () {
        var File2Changed = File2.replace("random()", "min(1,2)");
        var called = false;
        split2files(OPTS, File1, File2Changed, function (rf1, rf2, rfs) {
            expect(rf1).to.eql(resFile1);
            expect(rf2).to.eql(resFile2);
            expect(rfs).to.not.eql(resStateless);
            called = true;
        });
        expect(called).to.be.ok();
    });
    it("shall process files with default options as well", function () {
        "use strict";
        split2files(undefined, File1, File2, function (r1,r2,rs) {
           //ok
        });
    })

})