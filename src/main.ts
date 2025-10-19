import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

// Set up HTML structure
document.body.innerHTML = `
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
   <h1 class="title">SketchPad</h1>
   <canvas id="myCanvas" ></canvas>
  <button type="button" id="clearBtn">Clear</button>
  <button type="button" id="undoBtn">Undo</button>
  <button type="button" id="redoBtn">Redo</button>
`;

let drawing = false;

// Get canvas and context
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement | null;
const ctx = canvas?.getContext("2d");
const clearBtn = document.getElementById("clearBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

// Set canvas size to match its displayed size
if (canvas && ctx) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

// Store strokes as arrays of points
const strokes: { x: number; y: number }[][] = [];
let currentStroke: { x: number; y: number }[] = [];
const undoneStrokes: { x: number; y: number }[][] = [];

// Drawing logic
if (canvas && ctx) {
  const dispatchDrawingChanged = () => {
    canvas.dispatchEvent(new Event("drawing-changed"));
    console.log("Drawing changed, total strokes:", strokes.length);
  };

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStroke = [{ x, y }];
    strokes.push(currentStroke);
    dispatchDrawingChanged();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStroke.push({ x, y });
    dispatchDrawingChanged();
  });

  canvas.addEventListener("mouseup", () => (drawing = false));
  canvas.addEventListener("mouseleave", () => (drawing = false));

  // Redraw on drawing change
  //runs every time a stroke is added or modified

  canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";

    strokes.forEach((stroke) => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0]!.x, stroke[0]!.y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i]!.x, stroke[i]!.y);
      }
      ctx.stroke();
    });
  });
}

// Clear button
if (clearBtn && canvas && ctx) {
  clearBtn.addEventListener("click", () => {
    strokes.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dispatchEvent(new Event("drawing-changed"));
  });
}

// Undo button & Redo button

if (undoBtn && canvas) {
  undoBtn.addEventListener("click", () => {
    if (strokes.length > 0) {
      const undone = strokes.pop();
      if (undone) undoneStrokes.push(undone);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  });
}

if (redoBtn && canvas) {
  redoBtn.addEventListener("click", () => {
    if (undoneStrokes.length > 0) {
      const redone = undoneStrokes.pop();
      if (redone) strokes.push(redone);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  });
}
