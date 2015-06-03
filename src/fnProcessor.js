"use strict";
var iterate = require('./codeIterator');
var collectVars = require('./varCollector');

function exclude(array1, array2) {
    return array1.filter(function (item1) {
        return array2.indexOf(item1) === -1;
    });
}


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
