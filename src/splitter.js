"use strict";
var esprima = require('esprima');
var escodegen = require('escodegen');
var processFunctions = require('./fnProcessor');
var merge = require('merge');


function parseExpressionOnly(code) {
    return esprima.parse("function fn() {" + code + "}").body[0].body.body[0];
}

function defaultCriteria(fnDescr) {
    return fnDescr.attribute === "__st8less" || fnDescr.attribute === "__stateless";
}


function Splitter(options) {
    this.options = merge({
        criteria: defaultCriteria,
        encoding: "UTF-8",
        append: "",
        objectName: "St8less",
        globalName: "window"
    }, options || {});
    this.options.fullObjectName = this.options.globalName + "." + this.options.objectName;
    this.collectedFns = [];
}


Splitter.prototype = {

    _addFn: function (fnDescr, fnBody) {
        var name = fnDescr.name + this.collectedFns.length,
            fullName = this.options.fullObjectName + "." + name,
            paramList = fnDescr.paramNames.concat(fnDescr.externalVariables).join(', ');
        this.collectedFns.push([
            fullName, " = function (", paramList, ")",
            escodegen.generate(fnBody)
        ].join(""));
        return fullName + ".apply(this, [" + paramList + "])";
    },

    parse: function (src, cb) {
        var parsed = esprima.parse(src, {loc: true, comment: true}), fnCall;
        processFunctions(parsed, function (fnDescr, fnBody, replace) {
            if (this.options.criteria(fnDescr)) {
                fnCall = this._addFn(fnDescr, fnBody);
                replace(parseExpressionOnly("return " + fnCall));
            }
        }.bind(this));
        cb(null, escodegen.generate(parsed));
    },

    done: function (cb) {
        var body = [
            this.options.fullObjectName + " = {};"
        ]
            .concat(this.collectedFns)
            .concat([this.options.append])
            .join("\n\n");
        cb(null, body);
    }
};

module.exports = Splitter;
