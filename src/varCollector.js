"use strict";
var iterate = require('./codeIterator');

function VarCollector() {
    this.vars = {};
    this.declaredVars = {};
}

VarCollector.prototype = {

    getExternalVariables: function () {
        return Object.keys(this.vars);
    },

    "Identifier": function (node) {
        this.onUse(node.name);
    },

    onDeclare: function (name) {
        this.declaredVars[name] = true;
        delete this.vars[name];
    },

    onUse: function (name) {
        if (!this.declaredVars[name]) {
            this.vars[name] = true;
        }
    },

    "FunctionDeclaration": function (node, next) {
        this.FunctionExpression(node, next);
    },

    "FunctionExpression": function (node, next) {
        node.params.forEach(function (param) {
            this.onDeclare(param.name);
        }.bind(this));
        next(node.body);
    },

    "VariableDeclarator": function (node, next) {
        if (node.id && node.id.type === 'Identifier') {
            this.onDeclare(node.id.name);
        }
        next(node.init);
    },

    "CatchClause": function (node, next) {
        this.onDeclare(node.param.name);
        next(node.body);
    },

    "MemberExpression": function (node, next) {
        if (node.computed) {
            next(node.property);
        }
        next(node.object);
    }


};

/**
 * Collects identifiers used in the code and not defined inside it - so here could be variables available from closures, global variables, etc.
 * @param parsedCode
 * @returns {Array.<String>} identifiers (variable names)
 */
module.exports = function collectVars(parsedCode) {
    var vc = new VarCollector();
    iterate(parsedCode, vc);
    return vc.getExternalVariables();
};
