var _a = require('canvas'), createCanvas = _a.createCanvas, loadImage = _a.loadImage, Context2d = _a.Context2d;
var fs = require('fs');
var TreeModel = require('tree-model');
var CDKjson = require("./tree.json");
var CreateCanvasFile = function (canvas, fileName) { return new Promise(function (resolve) {
    var out = fs.createWriteStream(fileName);
    var stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on('finish', function () { return console.log('The CDK Tree file was created.'); });
}); };
/**
 * @typedef {{x: number, y: number}} Position
 * @typedef {{children: Array<TreeNode>, display: string}} TreeNode
 *
 * @typedef {{block: {width: number, height: number},
 *      delta: {width: number, height: number},
 *      offset: {x: number, y: number},
 *      displayType: 'text' | 'image',
 *      colors: {block: string, line: string, font: string, background: string},
 *      font: string}} Options
 */
/** @type {Options} */
var defaultOptions = {
    block: { width: 140, height: 120 },
    delta: { width: 100, height: 80 },
    offset: { x: 20, y: 40 },
    displayType: 'text',
    colors: {
        block: 'rgba(0, 0, 0, 255)',
        line: 'rgba(0, 0, 0, 255)',
        font: 'rgba(0, 0, 0, 255)',
        background: 'rgba(0, 0, 0, 0)'
    },
    arrow: {
        bottom: false,
        top: false,
        open: 3,
        size: 10
    },
    font: '30px Impact'
};
/** @type {Array<{node: TreeNode, position: Position}>} */
var positions = [];
var bounds = { x: 0, y: 0 };
var xOffset;
/**
 * @template T
 * @param {T} root
 * @param {function (T): Array<T>} getChildren
 * @param {Options} options
 */
var getPositions = function (root, getChildren, options) {
    /**
     * @param {T} node
     * @param {number} y
     * @returns {boolean} true if position was computed if first time
     */
    var setNodePosition = function (node, y) {
        var savedPosition = positions.find(function (val) { return val.node === node; });
        if (savedPosition !== undefined) {
            if (y > savedPosition.position.y) {
                savedPosition.position.y = y;
                bounds.y = Math.max(bounds.y, y + options.block.height);
                getChildren(node).forEach(function (child) {
                    return setNodePosition(child, y + options.delta.height + options.block.height);
                });
                return true;
            }
            return false;
        }
        bounds.y = Math.max(bounds.y, y + options.block.height);
        var lastXOffset = xOffset;
        var computedChildren = 0;
        getChildren(node).forEach(function (child) {
            var isComputed = setNodePosition(child, y + options.delta.height + options.block.height);
            if (isComputed) {
                xOffset += options.delta.width + options.block.width;
                computedChildren++;
            }
        });
        if (computedChildren > 0) {
            xOffset -= options.delta.width + options.block.width;
        }
        bounds.x = Math.max(bounds.x, xOffset + options.block.width);
        var resultPosition = { x: (lastXOffset + xOffset) / 2, y: y };
        positions.push({ node: node, position: resultPosition });
        return true;
    };
    setNodePosition(root, options.offset.y);
    xOffset += options.delta.width + options.block.width;
};
/**
 *
 * @param {line x0} x0
 * @param {line y0} y0
 * @param {line x1} x1
 * @param {line y1} y1
 * @param {how open the arrow is} arrowOpen
 * @param {how big thr arrow's lines are} arrowLength
 * @param {arrow at the start of the line} arrowStart
 * @param {arrow at the end of the line} arrowEnd
 * @param {the line color} lineColor
 */
function drawLineWithArrows(context, x0, y0, x1, y1, arrowOpen, arrowLength, arrowStart, arrowEnd, lineColor) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    var angle = Math.atan2(dy, dx);
    var length = Math.sqrt(dx * dx + dy * dy);
    // Line
    context.strokeStyle = lineColor;
    context.translate(x0, y0);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(length, 0);
    // Arrows
    if (arrowEnd) {
        context.moveTo(arrowLength, -arrowOpen);
        context.lineTo(0, 0);
        context.lineTo(arrowLength, arrowOpen);
    }
    if (arrowStart) {
        context.moveTo(length - arrowLength, -arrowOpen);
        context.lineTo(length, 0);
        context.lineTo(length - arrowLength, arrowOpen);
    }
    context.stroke();
    context.setTransform(1, 0, 0, 1, 0, 0);
}
var drawNodes = function (root, getChildren, getDisplay, context, options) {
    /** @type {Array<T>} */
    var drawed = [];
    /**
     * @param {T} node
     */
    var drawNode = function (node) {
        if (drawed.includes(node)) {
            return;
        }
        drawed.push(node);
        var position = positions.find(function (val) { return val.node === node; }).position;
        context.font = options.font;
        context.textAlign = 'center';
        context.fillStyle = options.colors.font;
        context.fillText(getDisplay(node), position.x + options.block.width / 2, position.y + options.block.height * 3 / 4);
        context.strokeStyle = options.colors.block;
        context.strokeRect(position.x, position.y, options.block.width, options.block.height);
        getChildren(node).forEach(function (child) {
            var childPosition = positions.find(function (val) { return val.node === child; }).position;
            drawLineWithArrows(context, position.x + options.block.width / 2, position.y + options.block.height, childPosition.x + options.block.width / 2, childPosition.y, options.arrow && options.arrow.open, options.arrow && options.arrow.size, options.arrow && options.arrow.bottom, options.arrow && options.arrow.top, options.colors.line);
            drawNode(child);
        });
    };
    drawNode(root);
};
/**
 * @template T
 * @param {Array<T>} roots
 * @param {function (T): Array<T>} getChildren
 * @param {function (T): string} getDisplay
 * @param {string} savePath
 * @param {Options} options
 * @returns {Promise}
 */
var drawAsTree = function (roots, getChildren, getDisplay, savePath, options) {
    if (options === void 0) { options = defaultOptions; }
    positions = [];
    bounds.x = 0;
    bounds.y = 0;
    xOffset = options.offset.x;
    roots.forEach(function (root) { return getPositions(root, getChildren, options); });
    bounds.x += options.offset.x;
    bounds.y += options.offset.y;
    var canvas = createCanvas(bounds.x, bounds.y);
    var context = canvas.getContext('2d');
    context.fillStyle = options.colors.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    roots.forEach(function (root) { return drawNodes(root, getChildren, getDisplay, context, options); });
    return CreateCanvasFile(canvas, savePath);
};
/**
 * @param {Array <TreeNode>} roots
 * @param {string} savePath
 * @param {Options} options
 * @returns {Promise} on file saved
 */
var drawTree = function (roots, savePath, options) {
    if (options === void 0) { options = defaultOptions; }
    drawAsTree(roots, function (node) { return node.children; }, function (node) { return node.display; }, savePath, options);
};
var Test1 = [{
        children: [
            { children: [], display: 'Node1' },
            { children: [], display: 'Node2' }
        ],
        display: 'Root'
    }];
var Test2 = [{
        children: [
            { children: [
                    { children: [], display: 'Node11' },
                    { children: [], display: 'Node12' }
                ], display: 'Node1' },
            { children: [
                    { children: [], display: 'Node21' },
                    { children: [], display: 'Node22' },
                    { children: [], display: 'Node23' }
                ], display: 'Node2' },
            { children: [
                    { children: [], display: 'Node31' }
                ], display: 'Node3' },
        ], display: 'Root'
    }
];
// drawTree (Test1, 'CDKtree.png');
drawTree(Test2, 'CDKtree.png');
var CDKtreejson = JSON.parse(JSON.stringify(CDKjson).replace(/-/g, '_'));
var CDKtree = CDKtreejson.tree;
////////////////// Try-1 ////////////////////
// var tree = new TreeModel()
// function GetTree(CDKtree, parent=null) {
//     if(CDKtree.children == undefined){
//         var child = tree.parse({display:  "id: " + CDKtree.id + "   path: " + CDKtree.path + "   fqn: " + CDKtree.constructInfo.fqn, children: []});
//         parent.addChild(child)
//     }
//     else{
//         if (parent == null){    // Root
//             var root = tree.parse({display: "id: " + CDKtree.id + "   path: " + CDKtree.path + "   fqn: " + CDKtree.constructInfo.fqn, children: []});
//             Object.keys(CDKtree.children).forEach(Child => {
//                 GetTree(CDKtree.children[Child], root);
//             });
//         } 
//         else{
//             Object.keys(CDKtree.children).forEach(Child => {
//                 var child = tree.parse({display:  "id: " + CDKtree.id + "   path: " + CDKtree.path + "   fqn: " + CDKtree.constructInfo.fqn, children: []});
//                 parent.addChild(child)
//                 GetTree(CDKtree.children[Child], child);
//             });
//         }
//     }
//     return root;
// };
// var root = GetTree(CDKtree);
// console.log(JSON.stringify(root, null, '\t'));
// drawTree (Test1, 'CDKtree.png');
////////////////// Try-2 /////////////////////
// class TreeNode {
//     id: string;
//     path: string;
//     fqn: string;
//     parent: string;
//     layer: number;
//     constructor(id: string, path: string, fqn: string, parent: string, layer: number) {
//         this.id = id;
//         this.path = path;
//         this.fqn = fqn;
//         this.parent = parent;
//         this.layer = layer;
//     }
//     print(){
//         console.log()
//         console.log("id = " + this.id + "  path = " + this.path + "  fqn = " + this.fqn + "  parent = " + this.parent + "  layer = " + this.layer);
//         console.log()
//     }
// }
// var CDKtreejson = JSON.parse(JSON.stringify(CDKjson).replace(/-/g, '_'));
// var CDKtree = CDKtreejson.tree
// interface INode {
//     id: string;
//     path: string;
//     fqn: string;
//     parent: string;
//     layer: number;
// }
// let TreeNodes: INode[ ] = []
// function GetTree(CDKtree, parent="NaN", layer=1) {
//     TreeNodes.push({
//         "id": CDKtree.id, 
//         "path": CDKtree.path, 
//         "fqn": CDKtree.constructInfo.fqn, 
//         "parent": parent, 
//         "layer": layer
//     });
//     if(CDKtree.children == undefined) return 1;
//     Object.keys(CDKtree.children).forEach(Child => {
//         GetTree(CDKtree.children[Child], CDKtree.id , layer+1);
//     });
// };
// GetTree(CDKtree);
// var MaxLayer = TreeNodes.reduce((acc, TreeNode) => acc = acc > TreeNode.layer ? acc : TreeNode.layer, 0);
// for (let Layer = MaxLayer; Layer > 0; Layer--) {
//     TreeNodes.forEach(EachNode => {
//         if (EachNode.layer == Layer){
//         }
//     });
// }
// drawTree (Test2, 'CDKtree.png');
