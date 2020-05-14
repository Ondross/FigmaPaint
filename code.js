// This shows the HTML page in "ui.html".
figma.showUI(__html__);
function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
// Create a dummy node so that we can read our session ID and use that
// to identify other nodes created by us.
const node = figma.createRectangle();
const sessionId = node.id.split(':')[0];
node.remove();
let colorWatcher;
let currentColor = null;
let currentWidth = 1;
let eraser = true;
let existingNodeIds = figma.currentPage.findAll(node => node.type === "VECTOR").map(node => node.id);
setInterval(() => {
    const allNodes = figma.currentPage.findAll(node => node.type === "VECTOR");
    allNodes.filter(node => {
        if (node.removed) {
            return false;
        }
        const isNew = existingNodeIds.indexOf(node.id) === -1;
        const isMine = node.id.startsWith(sessionId);
        return isNew && isMine;
    }).forEach(node => {
        node.strokeWeight = currentWidth;
        node.opacity = 1;
        if (eraser) {
            node.name = 'eraser';
            currentColor = node.parent.backgrounds[0].color;
        }
        if (currentColor) {
            const strokes = clone(node.strokes);
            strokes[0].color = currentColor;
            node.strokes = strokes;
        }
    });
    existingNodeIds = allNodes.map(node => node.id);
}, 100);
figma.ui.onmessage = msg => {
    if (msg.type === 'set-color') {
        currentColor = { r: msg.r, g: msg.g, b: msg.b };
        eraser = false;
    }
    if (msg.type === 'set-width') {
        currentWidth = msg.width;
    }
    if (msg.type === 'eraser') {
        eraser = true;
    }
};
