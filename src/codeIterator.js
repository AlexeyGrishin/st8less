"use strict";

/**
 * Iterates over parsed js code and calls provided parser on nodes with expected type
 * @param {Object} code parsed js code
 * @param {Object} parser is an object with keys equal to node types and values are functions with two arguments - node and cb for further processing.
 *
 * Example of parser object:
 * {
 *  "VariableDeclaration": function (node, next) {
 *    if (node...) {
 *      next(node.right)
 *    }
 *  }
 * }
 *
 */
module.exports = function iterate(code, parser) {

    function goChildren(node) {
        var childrenProperty, child;
        for (childrenProperty in node) {
            if (node.hasOwnProperty(childrenProperty)) {
                child = node[childrenProperty];
                if (child && (child.type || (child[0] && child[0].type))) {
                    next(child);
                }
            }
        }
    }

    function next(node) {
        if (!node) {
            return;
        }
        if (Array.isArray(node)) {
            return node.forEach(next);
        }
        if (parser[node.type]) {
            parser[node.type](node, next);
        } else {
            goChildren(node);
        }

    }

    next(code);
};