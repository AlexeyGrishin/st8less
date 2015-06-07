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

/**
 * @callback CriteriaFn
 * @param {FnDescription} function description
 */

/**
 * Extracts marked functions from provided files to separate one
 * @param {Object} options
 * @param {CriteriaFn} options.criteria which functions shall be extracted
 * @param {String} options.append what to append to the file with extracted functions
 * @param {String} options.objectName object ot store extracted functions. Default is `St8less`
 * @param {String} options.globalName global object to use in calls. Default is `window`
 * @constructor
 *
 * @example
 * var ex = new Extractor();
 * ex.parse(fs.readFileSync('file1.js'), function (err, changed) {
 *   fs.writeFileSync('file1_changed.js', changed);
 *   ex.parse(fs.readFileSync('file2.js'), function (err, changed) {
 *     fs.writeFileSync('file2_changed.js', changed);
 *     ex.done(function (err, extracted) {
 *       fs.writeFileSync('extracted.js', extracted);
 *     });
 *   });
 * });
 */
function Extractor(options) {
    this.options = merge({
        criteria: defaultCriteria,
        append: "",
        objectName: "St8less",
        globalName: "window"
    }, options || {});
    this.options.fullObjectName = this.options.globalName + "." + this.options.objectName;
    this.collectedFns = [];
}


Extractor.prototype = {

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

module.exports = Extractor;
