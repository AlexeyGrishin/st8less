"use strict";

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