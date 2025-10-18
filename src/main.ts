import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
   <h1 class="title">SketchPad</h1>
   <canvas id="myCanvas" width="600" height="400"></canvas>
`;
