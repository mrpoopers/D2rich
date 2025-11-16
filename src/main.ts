import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
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
    if (this.points.length < 2) return; // need at least 2 points to draw
    ctx.beginPath();

    const firstPoint = this.points[0];
    if (!firstPoint) return;
    ctx.moveTo(firstPoint.x, firstPoint.y);

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

// Strokes storage
const strokes: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;

const undoneStrokes: MarkerLine[] = [];

// Drawing interaction

if (canvas && ctx) {
  const dispatchDrawingChanged = () => {
    canvas.dispatchEvent(new Event("drawing-changed"));
  };

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentLine = new MarkerLine(x, y);
    strokes.push(currentLine);

    dispatchDrawingChanged();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing || !currentLine) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentLine.drag(x, y);
    dispatchDrawingChanged();
  });

  canvas.addEventListener("mouseup", () => (drawing = false));
  canvas.addEventListener("mouseleave", () => (drawing = false));

  // Redraw on drawing-changed event

  canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";

    strokes.forEach((stroke) => stroke.display(ctx));
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "d") {
    console.log("strokes:", strokes);
  }
});

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
