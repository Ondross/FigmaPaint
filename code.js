// This shows the HTML page in "ui.html".
figma.showUI(__html__);
function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
const node = figma.createRectangle();
const sessionId = node.id.split(':')[0];
let colorWatcher;
let currentColor = null;
let currentWidth = 1;
let existingNodeIds = [];
setInterval(() => {
    const allNodes = figma.currentPage.findAll(node => node.type === "VECTOR");
    allNodes.filter(node => {
        const isNew = existingNodeIds.indexOf(node.id) === -1;
        const isMine = node.id.startsWith(sessionId);
        return isNew && isMine;
    }).forEach(node => {
        node.strokeWeight = currentWidth;
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
    }
    if (msg.type === 'set-width') {
        currentWidth = msg.width;
    }
};
