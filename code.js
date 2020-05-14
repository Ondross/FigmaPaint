// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 280, height: 300 });
function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
let colorWatcher;
let currentColor = null;
let currentWidth = 1;
let tool = 'brush';
let nodeInProgress = null;
let lastX = null;
let lastY = null;
let existingNodeIds = figma.currentPage.findAll(node => node.type === "VECTOR").map(node => node.id);
setInterval(() => {
    // Create a dummy node so that we can read our session ID and use that
    // to identify other nodes created by us.
    const node = figma.createRectangle();
    const sessionId = node.id.split(':')[0];
    node.remove();
    const newNode = figma.currentPage.findOne(node => {
        // Must be undeleted, a vector, and created by this user.
        if (node.removed || node.type !== "VECTOR" || !node.id.startsWith(sessionId) || node.name === 'sprayDrop') {
            return false;
        }
        // Must be "new", meaning we haven't seen it yet.
        return existingNodeIds.indexOf(node.id) === -1;
        return false;
    });
    if (!newNode) {
        return;
    }
    let color = currentColor;
    if (tool === 'brush') {
        newNode.opacity = 1;
    }
    else if (tool === 'eraser') {
        newNode.opacity = 1;
        newNode.name = 'eraser';
        color = newNode.parent.backgrounds[0].color;
    }
    else if (tool === 'spray-can') {
        newNode.opacity = 0;
    }
    else if (tool === 'highlighter') {
        newNode.opacity = .5;
    }
    else {
        console.log(`unknown tool ${tool}`);
    }
    newNode.strokeWeight = currentWidth;
    nodeInProgress = newNode;
    if (color) {
        const strokes = clone(newNode.strokes);
        strokes[0].color = color;
        newNode.strokes = strokes;
    }
    existingNodeIds.push(newNode.id);
}, 100);
setInterval(() => {
    if (tool === 'spray-can' && nodeInProgress && !nodeInProgress.removed) {
        const vertices = nodeInProgress.vectorNetwork.vertices;
        const lastVertex = vertices[vertices.length - 1];
        const x = lastVertex ? (lastVertex.x + nodeInProgress.x) : nodeInProgress.x;
        const y = lastVertex ? (lastVertex.y + nodeInProgress.y) : nodeInProgress.y;
        if (x !== lastX || y !== lastY || lastX === null) {
            for (let i = 0; i < 5; i++) {
                const sprayDrop = figma.createEllipse();
                sprayDrop.x = x + (Math.random() - .5) * (currentWidth * 2);
                sprayDrop.y = y + (Math.random() - .5) * (currentWidth * 2);
                const radius = .01 + Math.random() * 5;
                sprayDrop.resize(radius, radius);
                sprayDrop.name = 'sprayDrop';
                sprayDrop.opacity = 1;
                lastX = x;
                lastY = y;
                console.log;
                sprayDrop.strokeWeight = 2;
                if (currentColor) {
                    const fills = clone(sprayDrop.fills);
                    fills[0].color.r = Math.min(Math.max(currentColor.r + (Math.random() - .5) * .2, 0), 1);
                    fills[0].color.g = Math.min(Math.max(currentColor.g + (Math.random() - .5) * .2, 0), 1);
                    fills[0].color.b = Math.min(Math.max(currentColor.b + (Math.random() - .5) * .2, 0), 1);
                    sprayDrop.fills = fills;
                }
            }
        }
    }
}, 10);
figma.ui.onmessage = msg => {
    nodeInProgress = null;
    if (msg.type === 'set-color') {
        currentColor = { r: msg.r, g: msg.g, b: msg.b };
        if (tool === 'eraser') {
            tool = 'brush';
        }
    }
    if (msg.type === 'set-width') {
        currentWidth = msg.width;
    }
    if (msg.type === 'set-tool') {
        tool = msg.tool;
    }
};
