import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

class ToolPreview implements Drawable {
  constructor(
    public x: number,
    public y: number,
    public radius: number,
  ) {}

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

class MarkerLine implements Drawable {
  private points: { x: number; y: number }[] = [];

  constructor(startX: number, startY: number) {
    this.points.push({ x: startX, y: startY });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    ctx.beginPath();
    const firstPoint = this.points[0];
    if (firstPoint) {
      ctx.moveTo(firstPoint.x, firstPoint.y);
    }

    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      if (point) {
        ctx.lineTo(point.x, point.y);
      }
    }

    ctx.stroke();
  }
}

// Set up HTML structure
document.body.innerHTML = `
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
  <h1 class="title">SketchPad</h1>
  <canvas id="myCanvas"></canvas>
  <button type="button" id="clearBtn">Clear</button>
  <button type="button" id="undoBtn">Undo</button>
  <button type="button" id="redoBtn">Redo</button>
`;

let drawing = false;
let toolPreview: ToolPreview | null = null;

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement | null;
const ctx = canvas?.getContext("2d");

const clearBtn = document.getElementById("clearBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

// Match canvas resolution to displayed size
if (canvas && ctx) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

// Store strokes
const strokes: MarkerLine[] = [];
const undoneStrokes: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;

// helper
function getMouse(e: MouseEvent, canvas: HTMLCanvasElement) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

if (canvas && ctx) {
  const dispatchDrawingChanged = () => {
    canvas.dispatchEvent(new Event("drawing-changed"));
  };

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;

    const { x, y } = getMouse(e, canvas);
    currentLine = new MarkerLine(x, y);
    strokes.push(currentLine);

    dispatchDrawingChanged();
  });

  canvas.addEventListener("mousemove", (e) => {
    const { x, y } = getMouse(e, canvas);

    canvas.dispatchEvent(new CustomEvent("tool-moved", { detail: { x, y } }));

    if (!drawing || !currentLine) return;

    currentLine.drag(x, y);
    dispatchDrawingChanged();
  });

  canvas.addEventListener("mouseup", () => (drawing = false));

  canvas.addEventListener("mouseleave", () => {
    drawing = false;
    toolPreview = null;
    dispatchDrawingChanged();
  });

  // redraw everything
  canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";

    strokes.forEach((stroke) => stroke.display(ctx));

    if (toolPreview) toolPreview.display(ctx);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "d") {
    console.log("strokes:", strokes);
  }
});

if (canvas) {
  canvas.addEventListener("tool-moved", (e: Event) => {
    const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;

    if (!drawing) {
      if (!toolPreview) {
        toolPreview = new ToolPreview(x, y, 1);
      } else {
        toolPreview.updatePosition(x, y);
      }
    } else {
      toolPreview = null;
    }

    canvas.dispatchEvent(new Event("drawing-changed"));
  });
}

// Clear button
if (clearBtn && canvas && ctx) {
  clearBtn.addEventListener("click", () => {
    strokes.length = 0;
    undoneStrokes.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dispatchEvent(new Event("drawing-changed"));
  });
}

// Undo button
if (undoBtn && canvas) {
  undoBtn.addEventListener("click", () => {
    if (strokes.length > 0) {
      const undone = strokes.pop();
      if (undone) undoneStrokes.push(undone);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  });
}

// Redo button
if (redoBtn && canvas) {
  redoBtn.addEventListener("click", () => {
    if (undoneStrokes.length > 0) {
      const redone = undoneStrokes.pop();
      if (redone) strokes.push(redone);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  });
}
