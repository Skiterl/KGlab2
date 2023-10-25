import { Matrix } from "./math.js";

abstract class BasicSettings {
  protected _width: number;
  protected _height: number;
  protected _context: CanvasRenderingContext2D;
  protected _scale: number = 40;

  set width(x: number) {
    this._width = x;
  }

  set height(y: number) {
    this._height = y;
  }

  get context() {
    return this._context;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get scale() {
    return this._scale;
  }

  set scale(scale: number) {
    this._scale = scale;
  }

  constructor(x: number, y: number, context: CanvasRenderingContext2D) {
    this._width = x;
    this._height = y;
    this._context = context;
  }
}

class Poligon {
  private _points: Matrix[] = [];

  get points() {
    return this._points;
  }

  rotate(phi: number, x0: number = 0, y0: number = 0) {
    const newPoints = this.points.map((value, i) => {
      return new Matrix(3, 3, [
        [
          (value.at(0, 0) - x0) * Math.cos(phi),
          -(value.at(1, 0) - y0) * Math.sin(phi),
          x0,
        ],
        [
          (value.at(0, 0) - x0) * Math.sin(phi),
          (value.at(1, 0) - y0) * Math.cos(phi),
          y0,
        ],
        [0, 0, 1],
      ]);
    });

    return newPoints;
  }

  addPoint(x: number, y: number) {
    this._points.push(new Matrix(3, 1, [[x], [y], [1]]));
  }

  pop() {
    this.points.pop();
  }
}

class Chart {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private static _poligon: Poligon = new Poligon();

  get context() {
    return this._context;
  }

  scale: number = 40;

  private _basis: Matrix = new Matrix(3, 3, [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);

  private _grid: Grid | undefined;
  private _axes: Axes | undefined;
  private _ruler: Ruler | undefined;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._context = canvas.getContext("2d")!;
  }

  get canvas() {
    return this._canvas;
  }

  set grid(grid: Grid | undefined) {
    this._grid = grid;
  }

  set axes(axes: Axes | undefined) {
    this._axes = axes;
  }

  set ruler(ruler: Ruler | undefined) {
    this._ruler = ruler;
  }

  rotate(alpha: number, x0: number = 0, y0: number = 0) {
    const normX0 = (x0 - this.canvas.width / 2) / this.scale;
    const normY0 = (this.canvas.height / 2 - y0) / this.scale;
    const phi = (alpha * Math.PI) / 180;
  }

  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this._grid !== undefined) this._grid.draw();
    if (this._axes !== undefined) this._axes.draw();
    if (this._ruler !== undefined) this._ruler.draw();

    const poligon = Chart._poligon.points;

    poligon.forEach((point, i) => {
      this.drawLine(point, poligon[(i + 1) % poligon.length]);
    });
  }

  drawPoint(x: number, y: number) {
    const normX = (x - this.canvas.width / 2) / this.scale;
    const normY = (this.canvas.height / 2 - y) / this.scale;
    console.log(normX, normY);
    Chart._poligon.addPoint(normX, normY);
    this.context.beginPath();
    this.context.arc(x, y, 5, 0, 360);
    this.context.stroke();
  }

  drawLine(p1: Matrix, p2: Matrix) {
    if (p1 == null || p2 == null) return;
    const dispXp1 = p1.at(0, 0) * this.scale + this.canvas.width / 2;
    const dispYp1 = this.canvas.height / 2 - p1.at(1, 0) * this.scale;
    const dispXp2 = p2.at(0, 0) * this.scale + this.canvas.width / 2;
    const dispYp2 = this.canvas.height / 2 - p2.at(1, 0) * this.scale;
    this.context.beginPath();
    this.context.moveTo(dispXp1, dispYp1);
    this.context.lineTo(dispXp2, dispYp2);
    this.context.stroke();
  }
}

class Axes extends BasicSettings {
  constructor(x: number, y: number, context: CanvasRenderingContext2D) {
    super(x, y, context);
  }

  draw() {
    const xAxis: number = this.width / 2;
    const yAxis: number = this.height / 2;

    this.context.beginPath();
    this.context.strokeStyle = "black";

    this.context.moveTo(xAxis, 0);
    this.context.lineTo(xAxis, this.height);
    this.context.fillText("y", xAxis - 20, 10);

    this.context.moveTo(0, yAxis);
    this.context.lineTo(this.width, yAxis);
    this.context.fillText("x", this.width - 20, yAxis - 20);

    this.context.moveTo(this.width - this.scale / 2, yAxis - this.scale / 5);
    this.context.lineTo(this.width, yAxis);
    this.context.lineTo(this.width - this.scale / 2, yAxis + this.scale / 5);

    this.context.moveTo(xAxis - this.scale / 5, 0 + this.scale / 2);
    this.context.lineTo(xAxis, 0);
    this.context.lineTo(xAxis + this.scale / 5, 0 + this.scale / 2);

    this.context.stroke();
    this.context.closePath();
  }
}

class Grid extends BasicSettings {
  constructor(x: number, y: number, context: CanvasRenderingContext2D) {
    super(x, y, context);
  }

  draw() {
    const xAxis: number = this.width / 2;
    const yAxis: number = this.height / 2;

    this.context.beginPath();
    this.context.strokeStyle = "red";

    for (let i = xAxis; i <= this.width; i = i + this.scale) {
      this.context.moveTo(i, 0);
      this.context.lineTo(i, this.height);
    }

    for (let i = yAxis; i <= this.height; i = i + this.scale) {
      this.context.moveTo(0, i);
      this.context.lineTo(this.width, i);
    }

    for (let i = xAxis; i >= 0; i = i - this.scale) {
      this.context.moveTo(i, 0);
      this.context.lineTo(i, this.height);
    }

    for (let i = yAxis; i >= 0; i = i - this.scale) {
      this.context.moveTo(0, i);
      this.context.lineTo(this.width, i);
    }

    this.context.stroke();
    this.context.closePath();
  }
}

class Ruler extends BasicSettings {
  constructor(x: number, y: number, context: CanvasRenderingContext2D) {
    super(x, y, context);
  }

  draw() {
    const xAxis: number = this.width / 2;
    const yAxis: number = this.height / 2;

    this.context.beginPath();

    for (let i = 0; i <= this.width; i = i + this.scale) {
      this.context.fillText(
        String(Math.round((i - xAxis) / this.scale)),
        i + 5,
        yAxis + 5
      );
    }

    for (let i = 0; i <= this.height; i = i + this.scale) {
      this.context.fillText(
        String(Math.round((yAxis - i) / this.scale)),
        xAxis + 5,
        i + 5
      );
    }
    this.context.stroke();
    this.context.closePath();
  }
}

window.addEventListener("load", () => {
  window.addEventListener("mouseup", (e) => {
    if ((e.target as HTMLElement).closest(".js-dropdown-input")) {
      const container = (e.target as HTMLElement).closest(".js-dropdown-block");
      container?.classList.toggle("expanded");
    }
  });
});

const origCanvas: HTMLCanvasElement =
  document.querySelector("#original-canvas")!;
const transCanvas: HTMLCanvasElement = document.querySelector(
  "#transformated-canvas"
)!;

const origChart: Chart = new Chart(origCanvas);
const transChart: Chart = new Chart(transCanvas);

const origAxes = new Axes(
  origChart.canvas.width,
  origChart.canvas.height,
  origChart.context
);
const origGrid = new Grid(
  origChart.canvas.width,
  origChart.canvas.height,
  origChart.context
);
const origRuler = new Ruler(
  origChart.canvas.width,
  origChart.canvas.height,
  origChart.context
);
const transAxes = new Axes(
  transChart.canvas.width,
  transChart.canvas.height,
  transChart.context
);
const transGrid = new Grid(
  transChart.canvas.width,
  transChart.canvas.height,
  transChart.context
);
const transRuler = new Ruler(
  transChart.canvas.width,
  transChart.canvas.height,
  transChart.context
);

origChart.axes = origAxes;
origChart.grid = origGrid;
origChart.ruler = origRuler;
transChart.axes = transAxes;
transChart.grid = transGrid;
transChart.ruler = transRuler;
origChart.draw();
transChart.draw();

const drawButton: HTMLButtonElement = document.querySelector("#draw")!;
drawButton.addEventListener("click", () => {
  origChart.draw();
  transChart.draw();
});

const rotateButton: HTMLButtonElement = document.querySelector("#rotate")!;
rotateButton.addEventListener("click", () => {
  const angleInput: HTMLInputElement = document.querySelector("#rotate_range")!;
  let angle: number = parseInt(angleInput.value);
  transChart.rotate(angle);
});

origCanvas.addEventListener("mousedown", (e) => {
  if ((e.target as HTMLElement).closest("#original-canvas")) {
    origChart.drawPoint(e.offsetX, e.offsetY);
  }
});
