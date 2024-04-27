import { getStroke } from 'perfect-freehand'

interface InputPoint {
  x: number
  y: number
  pressure: number
}

interface Shape {
  path: Path2D
  fill?: string
}

export type Whiteboard = ReturnType<typeof createWhiteboard>

export function createWhiteboard(canvas: HTMLCanvasElement) {
  if (!canvas) {
    throw new Error('Canvas element not found')
  }

  const ctx = canvas.getContext('2d')!

  if (!ctx) {
    throw new Error('Could not get 2d context from canvas')
  }

  let currentShape: Shape | undefined

  const shapes: Shape[] = []
  const redoShapes: Shape[] = []

  let currentPointerId: number | undefined
  const pointers = new Map<number, string>()
  const strokePoints: InputPoint[] = []

  let requestAnimationFrameHandler: number | undefined

  let currentColor = '#fd7f50'
  const defaultColor = '#fd7f50'

  const process = () => {
    const path = getSvgPathFromStroke(
      getStroke(strokePoints, {
        simulatePressure: true,
        size: 16,
        smoothing: 0.6,
        thinning: 0.6,
        streamline: 0.5,
        easing: t => Math.sin((t * Math.PI) / 2),
      }),
    )

    if (currentShape) {
      currentShape.path = new Path2D(path)
      currentShape.fill = currentColor
    }
    else {
      currentShape = {
        path: new Path2D(path),
        fill: currentColor,
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const shape of shapes) {
      ctx.fillStyle = shape.fill || defaultColor
      ctx.fill(shape.path)
    }

    ctx.fillStyle = currentShape.fill || defaultColor
    ctx.fill(currentShape.path)
  }

  const renderLoop = () => {
    requestAnimationFrameHandler = requestAnimationFrame(renderLoop)
    process()
  }

  const pointerDraw = (e: PointerEvent) => {
    if (e.pointerId === currentPointerId) {
      const { clientX: x, clientY: y, pressure } = e
      strokePoints.push({ x, y, pressure })
    }
  }

  const onPointerDown = (e: PointerEvent) => {
    // e.preventDefault()

    // only track right mouse button
    if (e.pointerType === 'mouse' && e.button !== 0) {
      return
    }

    // set the current pointer
    pointers.set(e.pointerId, e.pointerType)
    currentPointerId = e.pointerId

    // clear the stroke points array
    strokePoints.length = 0

    // draw the first point
    pointerDraw(e)

    // start rendering
    renderLoop()
  }

  const onPointerMove = (e: PointerEvent) => {
    if (currentPointerId === undefined) {
      return
    }

    pointerDraw(e)
  }

  const onPointerUp = (e: PointerEvent) => {
    // untrack the pointer
    pointers.delete(e.pointerId)

    if (e.pointerId === currentPointerId) {
      currentPointerId = undefined

      // draw the last point
      pointerDraw(e)

      // stop the rendering
      cancelAnimationFrame(requestAnimationFrameHandler!)

      // flush the process as we have interrupted the rendering
      process()

      // At this point, we have a strokePoints filled by pointerDraw() and currentShape filled by process()

      // clear the stroke points array AFTER drawing the last point
      strokePoints.length = 0

      if (currentShape) {
        shapes.push(currentShape)
        currentShape = undefined
      }
    }
  }

  const onPointerCancel = (e: PointerEvent) => {
    onPointerUp(e)
  }

  const onContextMenuEvent = (e: MouseEvent) => {
    e.preventDefault()

    // redo
    if (e.ctrlKey) {
      const lastShape = redoShapes.pop()

      if (lastShape) {
        shapes.push(lastShape)
      }

      process()
      return
    }

    const lastShape = shapes.pop()
    if (lastShape) {
      redoShapes.push(lastShape)
    }

    process()
  }

  const onWindowResize = () => {
    canvas.width = window.innerWidth // window.screen.width
    canvas.height = window.innerHeight // window.screen.height
    process()
  }

  onWindowResize()

  // register a pointerdown only onto the canvas itself
  canvas.addEventListener('pointerdown', onPointerDown, { passive: true })
  canvas.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  window.addEventListener('pointercancel', onPointerCancel, { passive: true })
  canvas.addEventListener('contextmenu', onContextMenuEvent, { passive: false })
  window.addEventListener('resize', onWindowResize, { passive: true })

  const disconnect = () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerCancel)
    canvas.removeEventListener('contextmenu', onContextMenuEvent)
    window.removeEventListener('resize', onWindowResize)
  }

  return {
    get color() {
      return currentColor
    },
    set color(value: string) {
      currentColor = value
    },

    disconnect,
  }
}

function average(a: number, b: number) {
  return (a + b) / 2
}

function getSvgPathFromStroke(points: number[][], closed = true): string {
  const len = points.length

  if (len < 4) {
    return ``
  }

  let a = points[0]
  let b = points[1]
  const c = points[2]

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i]
    b = points[i + 1]
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `
  }

  if (closed) {
    result += 'Z'
  }

  return result
}
