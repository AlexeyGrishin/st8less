"use strict";
var iterate = require('./codeIterator');
var collectVars = require('./varCollector');

function exclude(array1, array2) {
    return array1.filter(function (item1) {
        return array2.indexOf(item1) === -1;
    });
}

/**
 * @callback OnFunctionCallback
 * @param {FnDescription} fnDescription
 * @param {Object} function body
 * @param {ReplacementCallback} could be called to replace function body
 *
 * @callback ReplacementCallback
 * @param {Object} node to replace the function body
 *
 * @namespace FnDescription
 * @property {String} name function name (or property/variable name that holds the function)
 * @property {String} attribute attribute defined as string expression at beggining of function
 * @property {Array,<String>} paramNames argument names
 * @property {Array,<String>} externalVariables variable/fn names used in function but not declared inside
 */

/**
 * Iterates over parsed code, looks for functions and calls callback on each of them
 * @param {Object} parsedCode parsed code
 * @param {OnFunctionCallback} onFn
 *
 */
module.exports = function processFunctions(parsedCode, onFn) {

    var stack = [], fnCollector;

    stack.peek = function peek() {
        return stack[stack.length - 1];
    };

    fnCollector = {
        "FunctionDeclaration": function (node, next) {
            this.FunctionExpression(node, next);
        },
        "VariableDeclarator": function (node, next) {
            stack.push(node.id.name);
            next(node.init);
            stack.pop();
        },
        "AssignmentExpression": function (node, next) {
            stack.push(node.left.name || (node.left.property && node.left.property.name));
            next(node.right);
            stack.pop();
        },
        "Property": function (node, next) {
            stack.push(node.key.name);
            next(node.value);
            stack.pop();
        },
        "FunctionExpression": function (node, next) {
            var body = node.body.body,
                firstLn = body[0],
                attribute = firstLn &&
                    firstLn.type === "ExpressionStatement" &&
                    firstLn.expression.type === "Literal" ? firstLn.expression.value : null,
                paramNames = node.params.map(function (p) { return p.name; }),
                fnDescription = {
                    name: (node.id && node.id.name) || stack.peek(),
                    paramNames: paramNames,
                    attribute: attribute,
                    externalVariables: exclude(collectVars(body), paramNames)
                };
            onFn(fnDescription, node.body, function (replacement) {
                node.body.body = [replacement];
            });
            next(body);
        }

    };

    iterate(parsedCode, fnCollector);
};
