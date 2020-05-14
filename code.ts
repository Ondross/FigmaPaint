// This shows the HTML page in "ui.html".
figma.showUI(__html__)

function clone(val) {
  return JSON.parse(JSON.stringify(val))
}

type Color = {
  r: number
  g: number
  b: number
}

// Create a dummy node so that we can read our session ID and use that
// to identify other nodes created by us.
const node = figma.createRectangle()
const sessionId = node.id.split(':')[0]
node.remove()

let colorWatcher: number
let currentColor: Color | null = null
let currentWidth: number = 1
let eraser = false
let sprayCan = false
let nodeInProgress: VectorNode | null = null
let lastX: number | null = null
let lastY: number | null = null

let existingNodeIds: string[] = figma.currentPage.findAll(node => node.type === "VECTOR").map(node => node.id)
setInterval(() => {
  const newNode = figma.currentPage.findOne(node => {
    // Must be undeleted, a vector, and created by this user.
    if (node.removed || node.type !== "VECTOR" || !node.id.startsWith(sessionId) || node.name === 'sprayDrop') {
      return false
    }

    // Must be "new", meaning we haven't seen it yet.
    return existingNodeIds.indexOf(node.id) === -1

    return false
  }) as VectorNode

  if (!newNode) {
    return
  }
  
  newNode.strokeWeight = currentWidth
  newNode.opacity = 1
  if (eraser) {
    newNode.name = 'eraser'
    currentColor = newNode.parent.backgrounds[0].color
  }
  if (sprayCan) {
    newNode.opacity = 0
  }

  nodeInProgress = newNode

  if (currentColor) {
    const strokes = clone(newNode.strokes)
    strokes[0].color = currentColor
    newNode.strokes = strokes
  }

  existingNodeIds.push(newNode.id)
}, 100)

setInterval(() => {
  if (sprayCan && nodeInProgress && !nodeInProgress.removed && nodeInProgress.vectorNetwork.vertices.length > 0) {
    const lastVertex = nodeInProgress.vectorNetwork.vertices[nodeInProgress.vectorNetwork.vertices.length - 1]
    if (lastVertex.x !== lastX || lastVertex.y !== lastY || lastX === null) {
      for (let i = 0; i < 5; i++) {
        const sprayDrop: RectangleNode = figma.createRectangle()
        sprayDrop.x = lastVertex.x + nodeInProgress.x + (Math.random() - .5) * 20
        sprayDrop.y = lastVertex.y + nodeInProgress.y + (Math.random() - .5) * 20
        sprayDrop.resize(2, 2)
        sprayDrop.name = 'sprayDrop'
        sprayDrop.opacity = 1

        lastX = lastVertex.x
        lastY = lastVertex.y

        sprayDrop.strokeWeight = 2
        if (currentColor) {
          const fills = clone(sprayDrop.fills)
          fills[0].color = currentColor
          sprayDrop.fills = fills
        }
      }
    }
  }
}, 10)

figma.ui.onmessage = msg => {
  if (msg.type === 'set-color') {
    currentColor = {r: msg.r, g: msg.g, b: msg.b}
    eraser = false
  }
  if (msg.type === 'set-width') {
    currentWidth = msg.width
    sprayCan = false
  }
  if (msg.type === 'eraser') {
    eraser = true
  }
  if (msg.type === 'spray-can') {
    sprayCan = true
    nodeInProgress = null
  }
}
