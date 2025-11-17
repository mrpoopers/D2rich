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
  private thickness: number;

  constructor(startX: number, startY: number, thickness: number) {
    this.thickness = thickness; // store style
    this.points.push({ x: startX, y: startY });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    ctx.lineWidth = this.thickness;
    ctx.strokeStyle = "black";

    ctx.beginPath();
    const first = this.points[0];
    if (!first) return;
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i];
      if (!p) continue;
      ctx.lineTo(p.x, p.y);
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

  <button type="button" id="thinBtn">Thin</button>
  <button type="button" id="thickBtn">Thick</button>
`;

let drawing = false;
let toolPreview: ToolPreview | null = null;
let currentThickness = 2;

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement | null;
const ctx = canvas?.getContext("2d");

const clearBtn = document.getElementById("clearBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const thinBtn = document.getElementById("thinBtn");
const thickBtn = document.getElementById("thickBtn");

// Match canvas resolution to displayed size
if (canvas && ctx) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

// Store strokes
const strokes: MarkerLine[] = [];
const undoneStrokes: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;

//thickness tool buttons

function updateToolButtons() {
  thinBtn?.classList.remove("selectedTool");
  thickBtn?.classList.remove("selectedTool");

  if (currentThickness === 2) thinBtn?.classList.add("selectedTool");
  if (currentThickness === 6) thickBtn?.classList.add("selectedTool");
}

thinBtn?.addEventListener("click", () => {
  currentThickness = 2;
  updateToolButtons();
});

thickBtn?.addEventListener("click", () => {
  currentThickness = 6;
  updateToolButtons();
});

// Initialize tool button states

function getMouse(e: MouseEvent, canvas: HTMLCanvasElement) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function flashButton(btn: HTMLElement) {
  btn.classList.add("selectedTool");
  setTimeout(() => btn.classList.remove("selectedTool"), 150); // quick flash
}

// Drawing logic

if (canvas && ctx) {
  const dispatchDrawingChanged = () => {
    canvas.dispatchEvent(new Event("drawing-changed"));
  };

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;

    const { x, y } = getMouse(e, canvas);
    currentLine = new MarkerLine(x, y, currentThickness); // ← add thickness
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
    flashButton(clearBtn);
    strokes.length = 0;
    undoneStrokes.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dispatchEvent(new Event("drawing-changed"));
  });
}

// Undo button
if (undoBtn && canvas) {
  undoBtn.addEventListener("click", () => {
    flashButton(undoBtn);
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
    flashButton(redoBtn);
    if (undoneStrokes.length > 0) {
      const redone = undoneStrokes.pop();
      if (redone) strokes.push(redone);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  });
}
