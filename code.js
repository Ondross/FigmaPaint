// This shows the HTML page in "ui.html".
figma.showUI(__html__);
function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
function overlap(a, b) {
    const aLeft = a.x;
    const aRight = a.x + a.width;
    const aTop = a.y;
    const aBottom = a.y + a.height;
    const bLeft = b.x;
    const bRight = b.x + b.width;
    const bTop = b.y;
    const bBottom = b.y + b.height;
    const xOverlap = (aLeft >= bLeft && aLeft <= bRight) ||
        (aRight >= bLeft && aRight <= bRight) ||
        (bRight >= aLeft && bRight <= aRight);
    const yOverlap = (aBottom <= bBottom && aBottom >= bTop) ||
        (aTop <= bBottom && aTop >= bTop) ||
        (bTop <= aBottom && bTop >= aTop);
    return xOverlap && yOverlap;
}
function erase(eraserNode, allNodes) {
    const strokes = clone(eraserNode.strokes);
    strokes[0].opacity = .0013;
    eraserNode.strokes = strokes;
    eraserNode.name = 'eraser';
    eraserNode.strokeWeight = 8;
    const subtractionNodes = figma.currentPage.findAll(node => node.type === "BOOLEAN_OPERATION");
    allNodes.concat(subtractionNodes).filter(erased => {
        if (erased.removed) {
            return false;
        }
        const isEraser = erased.name === 'eraser';
        const isInSubtraction = erased.parent.type === 'BOOLEAN_OPERATION';
        return (erased.id !== eraserNode.id) && !isEraser && !isInSubtraction;
    }).forEach(erased => {
        if (overlap(eraserNode, erased)) {
            console.log('erase', eraserNode, erased);
            const eraser = eraserNode.clone();
            const excluded = figma.subtract([erased, eraser], figma.currentPage);
            excluded.strokes = clone(erased.strokes);
            excluded.fills = clone(erased.fills);
            excluded.strokeWeight = erased.strokeWeight;
        }
    });
}
// Create a dummy node so that we can read our session ID and use that
// to identify other nodes created by us.
const node = figma.createRectangle();
const sessionId = node.id.split(':')[0];
node.remove();
let colorWatcher;
let currentColor = null;
let currentWidth = 1;
let eraser = null;
let eraserNumVertices = 0;
let existingNodeIds = figma.currentPage.findAll(node => node.type === "VECTOR").map(node => node.id);
setInterval(() => {
    const allNodes = figma.currentPage.findAll(node => node.type === "VECTOR");
    // If the eraser is changing, just keep erasing
    // caveat: if you hold your mouse still, the eraser will eventually die off.
    if (eraser && !eraser.removed) {
        if (eraser.vectorNetwork.vertices.length !== eraserNumVertices) {
            // erase(eraser, allNodes)
            eraserNumVertices = eraser.vectorNetwork.vertices.length;
            return;
        }
        else {
            erase(eraser, allNodes);
            eraser.remove();
        }
    }
    // Otherwise, let's look for new nodes.
    allNodes.filter(node => {
        if (node.removed) {
            return false;
        }
        const isNew = existingNodeIds.indexOf(node.id) === -1;
        const isMine = node.id.startsWith(sessionId);
        // Don't worry about "clones"
        const isInSubtraction = (node.parent && node.parent.type === 'BOOLEAN_OPERATION');
        // Don't look at the results of erasing
        const isVector = node.type === "VECTOR";
        return isNew && isMine && !isInSubtraction && isVector;
    }).forEach(node => {
        // node.strokeWeight = currentWidth
        // if (currentColor) {
        //   const strokes = clone(node.strokes)
        //   strokes[0].color = currentColor
        //   node.strokes = strokes
        // }
        // eraser mode
        eraser = node;
        eraserNumVertices = eraser.vectorNetwork.vertices.length;
        //  erase(node, allNodes)
    });
    existingNodeIds = allNodes.map(node => node.id);
}, 1000);
figma.ui.onmessage = msg => {
    if (msg.type === 'set-color') {
        currentColor = { r: msg.r, g: msg.g, b: msg.b };
    }
    if (msg.type === 'set-width') {
        currentWidth = msg.width;
    }
};
