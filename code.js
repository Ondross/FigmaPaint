// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
// This shows the HTML page in "ui.html".
figma.showUI(__html__);
function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
let colorWatcher;
figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'go-red') {
        clearInterval(colorWatcher);
        colorWatcher = setInterval(() => {
            const allNodes = figma.currentPage.findAll(node => node.type === "VECTOR");
            allNodes.forEach(node => {
                const strokes = clone(node.strokes);
                strokes[0].color.r = 1;
                strokes[0].color.b = 0;
                strokes[0].color.g = 0;
                node.strokes = strokes;
            });
        }, 100);
    }
    if (msg.type === 'go-blue') {
        clearInterval(colorWatcher);
        colorWatcher = setInterval(() => {
            const allNodes = figma.currentPage.findAll(node => node.type === "VECTOR");
            allNodes.forEach(node => {
                const strokes = clone(node.strokes);
                strokes[0].color.r = 0;
                strokes[0].color.b = 1;
                strokes[0].color.g = 0;
                node.strokes = strokes;
            });
        }, 100);
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    // figma.closePlugin();
};
