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
    ctx.strokeStyle = currentMarkerColor;
    ctx.fillStyle = currentMarkerColor + "33";
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

class MarkerLine implements Drawable {
  private points: { x: number; y: number }[] = [];
  private thickness: number;
  private color: string;

  constructor(
    startX: number,
    startY: number,
    thickness: number,
    color: string,
  ) {
    this.thickness = thickness;
    this.color = color;
    this.points.push({ x: startX, y: startY });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    ctx.lineWidth = this.thickness;
    ctx.strokeStyle = this.color;

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

// deno-lint-ignore prefer-const
let stickerList: string[] = ["🐸", "🦉", "🐻"];

class Sticker implements Drawable {
  public x: number;
  public y: number;
  public size: number = 32; // small emoji size
  public emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = `${this.size}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
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
  <button type="button" id="exportBtn">Export</button>

  <button type="button" id="customStickerBtn">Add Sticker</button>
  <div id="stickerButtons"></div>
`;

let drawing = false;
let toolPreview: ToolPreview | null = null;
let currentThickness = 2;

let currentTool: "draw" | "sticker" = "draw";
let currentSticker: string | null = null;
let stickerPreview: Sticker | null = null;
let currentMarkerColor = "black";

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement | null;
const ctx = canvas?.getContext("2d");

const clearBtn = document.getElementById("clearBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const thinBtn = document.getElementById("thinBtn");
const thickBtn = document.getElementById("thickBtn");

//sticker tool buttons

const stickerButtonsDiv = document.getElementById("stickerButtons")!;

function selectSticker(emoji: string) {
  currentTool = "sticker";
  currentSticker = emoji;

  stickerPreview = new Sticker(0, 0, emoji);
}

function renderStickerButtons() {
  stickerButtonsDiv.innerHTML = ""; // clear existing

  stickerList.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.textContent = emoji;

    btn.addEventListener("click", () => selectSticker(emoji));

    stickerButtonsDiv.appendChild(btn);
  });
}

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 45%)`;
}

const customStickerBtn = document.getElementById("customStickerBtn");
const exportBtn = document.getElementById("exportBtn");

customStickerBtn?.addEventListener("click", () => {
  const text = prompt("Custom sticker text", "🧽");

  if (!text) return; // user cancelled

  // Add to list
  stickerList.push(text);

  // Re-render buttons
  renderStickerButtons();
});

// First render of the initial stickers
renderStickerButtons();

if (exportBtn && canvas) {
  exportBtn.addEventListener("click", () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;

    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    const scaleX = exportCanvas.width / canvas.width;
    const scaleY = exportCanvas.height / canvas.height;

    // Scale so the drawing expands to fill 1024×1024
    exportCtx.scale(scaleX, scaleY);

    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
  });
}

// Match canvas resolution to displayed size
if (canvas && ctx) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

// Store strokes
const strokes: Drawable[] = [];
const undoneStrokes: Drawable[] = [];
let currentLine: MarkerLine | null = null;

//thickness tool buttons

function updateToolButtons() {
  thinBtn?.classList.remove("selectedTool");
  thickBtn?.classList.remove("selectedTool");

  if (currentThickness === 2.5) thinBtn?.classList.add("selectedTool");
  if (currentThickness === 6.5) thickBtn?.classList.add("selectedTool");
}

thinBtn?.addEventListener("click", () => {
  currentThickness = 2;
  currentTool = "draw";
  currentSticker = null;
  stickerPreview = null;

  currentMarkerColor = randomColor();
  updateToolButtons();
});

thickBtn?.addEventListener("click", () => {
  currentThickness = 6;
  currentTool = "draw";
  currentSticker = null;
  stickerPreview = null;

  currentMarkerColor = randomColor();
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
    const { x, y } = getMouse(e, canvas);

    if (currentTool === "draw") {
      drawing = true;
      currentLine = new MarkerLine(
        x,
        y,
        currentThickness,
        currentMarkerColor,
      );
      strokes.push(currentLine);
    }

    if (currentTool === "sticker" && currentSticker) {
      const s = new Sticker(x, y, currentSticker);
      strokes.push(s); // add sticker to drawing
      stickerPreview = null;
    }

    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (e) => {
    const { x, y } = getMouse(e, canvas);

    canvas.dispatchEvent(new CustomEvent("tool-moved", { detail: { x, y } }));

    if (currentTool === "draw") {
      if (drawing && currentLine) currentLine.drag(x, y);
    }

    if (currentTool === "sticker" && stickerPreview) {
      stickerPreview.x = x;
      stickerPreview.y = y;
    }

    canvas.dispatchEvent(new Event("drawing-changed"));
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

    strokes.forEach((stroke) => stroke.display(ctx));

    if (currentTool === "draw" && toolPreview) {
      toolPreview.display(ctx);
    }

    if (currentTool === "sticker" && stickerPreview) {
      stickerPreview.display(ctx);
    }
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
