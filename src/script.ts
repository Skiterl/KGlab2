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

  set points(points: Matrix[]) {
    this._points = Object.assign([], points)
  }

  addPoint(x: number, y: number) {
    this._points.push(new Matrix(3, 1, [[x], [y], [1]]));
  }

  pop() {
    this.points.pop();
  }

  clear() {
    this.points = []
  }
}

class Chart {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private static _poligon: Poligon = new Poligon();
  private _transformedPoligon: Poligon = new Poligon();

  get transformedPoligon() {
    return this._transformedPoligon
  }

  get basis() {
    return this._basis
  }

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

  lineEquationY(x1: number, y1: number, x2: number, y2: number) {
    2
    return (0 - y1) / (y2 - y1) * (x2 - x1) + x1
  }

  findAngleRad(x0: number, y0: number) {
    if (Math.abs(Math.atan2(y0, x0)) <= 0.0001) return 0.0001
    return Math.atan2(y0, x0)
  }

  transferSide(x0: number, y0: number) {
    const normX0 = (x0 - this.canvas.width / 2) / this.scale;
    const normY0 = (this.canvas.height / 2 - y0) / this.scale;
    const poligon = this._transformedPoligon.points
    let foundSide = false
    let sidePoint1: Matrix = new Matrix(3, 1)
    let sidePoint2: Matrix = new Matrix(3, 1)
    poligon.forEach((point, i) => {
      const point1 = point;
      const point2 = poligon[(i + 1) % poligon.length]
      if (Math.abs(point2.at(0, 0) - point1.at(0, 0)) <= 0.1) {
        if (Math.abs(normX0 - point1.at(0, 0)) <= 0.3) {
          let max = Math.max(point1.at(1, 0), point2.at(1, 0))
          let min = Math.min(point1.at(1, 0), point2.at(1, 0))
          if (normY0 > min && normY0 < max) {
            foundSide = true
            sidePoint1 = point1
            sidePoint2 = point2
          }
        }
      }

      else if (Math.abs(point2.at(1, 0) - point1.at(1, 0)) <= 0.1) {
        if (Math.abs(normY0 - point1.at(1, 0)) <= 0.3) {
          let max = Math.max(point1.at(0, 0), point2.at(0, 0))
          let min = Math.min(point1.at(0, 0), point2.at(0, 0))
          if (normX0 > min && normX0 < max) {
            foundSide = true
            sidePoint1 = point1
            sidePoint2 = point2
          }
        }
      }
      if (Math.abs((normX0 - point1.at(0, 0)) / (point2.at(0, 0) - point1.at(0, 0)) - (normY0 - point1.at(1, 0)) / (point2.at(1, 0) - point1.at(1, 0))) <= 0.3) {
        foundSide = true
        sidePoint1 = point1
        sidePoint2 = point2
      }
    });
    if (!foundSide) throw new Error("Перенос возможен только относительно стороны многоугольника")

    const x = this.lineEquationY(sidePoint1.at(0, 0), sidePoint1.at(1, 0), sidePoint2.at(0, 0), sidePoint2.at(1, 0))
    const angleRad = this.findAngleRad(sidePoint1.at(0, 0) - x, sidePoint1.at(1, 0))
    let angle = (angleRad * 180 / Math.PI)
    let sideLength = Math.sqrt((sidePoint1.at(0, 0) - sidePoint2.at(0, 0)) ** 2 + (sidePoint1.at(1, 0) - sidePoint2.at(1, 0)) ** 2)
    console.log(angle)
    if (angle < 0) {
      angle = angle + 360
    }
    if (angle > 90 && angle < 180 || angle > 270 && angle < 360) {
      sideLength = -sideLength
    }
    console.log(angle)
    //this.transfer(-x, 0)
    //this.pointRotate(-(angle))
    this.transfer(sidePoint1.at(0, 0) - sidePoint2.at(0, 0), sidePoint1.at(1, 0) - sidePoint2.at(1, 0))
    //this.pointRotate((angle))
    //this.transfer(x, 0)
  }

  vectorReflection(x0: number, y0: number) {
    if (this._transformedPoligon.points.length < 3) throw new Error("Необходимо минимум 3 соединенные точки")
    const normX0 = (x0 - this.canvas.width / 2) / this.scale;
    const normY0 = (this.canvas.height / 2 - y0) / this.scale;
    const angleRad = this.findAngleRad(normX0, normY0)
    this.pointRotate(-(angleRad * 180 / Math.PI))
    this.reflectionOx()
    this.pointRotate((angleRad * 180 / Math.PI))
  }

  reflectionOx() {
    const reflectionMatrix = new Matrix(3, 3, [
      [1, 0, 0],
      [0, -1, 0],
      [0, 0, 1],
    ]);

    this._basis = reflectionMatrix.multiply(this._basis)
  }

  scaling(k: number) {
    if (this._transformedPoligon.points.length < 3) throw new Error("Необходимо минимум 3 соединенные точки")
    const scaleMatrix = new Matrix(3, 3, [
      [k, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);

    this._basis = scaleMatrix.multiply(this._basis)
  }

  pointRotate(alpha: number, x0: number = this.canvas.width / 2, y0: number = this.canvas.height / 2) {
    if (this._transformedPoligon.points.length < 3) throw new Error("Необходимо минимум 3 соединенные точки")
    const normX0 = (x0 - this.canvas.width / 2) / this.scale;
    const normY0 = (this.canvas.height / 2 - y0) / this.scale;
    const phi = (alpha * Math.PI) / 180;
    const rotateMatrix = new Matrix(3, 3, [
      [Math.cos(phi), -Math.sin(phi), 0],
      [Math.sin(phi), Math.cos(phi), 0],
      [0, 0, 1],
    ]);
    this.transfer(-normX0, -normY0)
    this._basis = rotateMatrix.multiply(this._basis);
    this.transfer(normX0, normY0)
  }

  transfer(x0: number = 0, y0: number = 0) {
    const transferMatrix = new Matrix(3, 3, [
      [1, 0, x0],
      [0, 1, y0],
      [0, 0, 1]
    ]);

    this._basis = transferMatrix.multiply(this._basis);
  }

  connect() {
    this._transformedPoligon = new Poligon();
    this._transformedPoligon.points = Chart._poligon.points

    const poligon = Chart._poligon.points;
    if (poligon.length < 3) throw new Error("Необходимо минимум 3 точки")
    this.clear()
    poligon.forEach((point, i) => {
      this.drawLine(point, poligon[(i + 1) % poligon.length]);
    });
  }

  draw() {
    const poligon = this._transformedPoligon.points;
    if (poligon.length < 3) throw new Error("Необходимо минимум 3 соединенные точки")
    this.clear()

    const transPoligon = poligon.map((value, i) => {
      return this._basis.multiply(value);
    });

    transPoligon.forEach((point, i) => {
      this.drawLine(point, transPoligon[(i + 1) % transPoligon.length]);
    });

    return transPoligon
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this._grid !== undefined) this._grid.draw();
    if (this._axes !== undefined) this._axes.draw();
    if (this._ruler !== undefined) this._ruler.draw();
  }

  clearPoints() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._transformedPoligon = new Poligon()
    Chart._poligon = new Poligon()
    if (this._grid !== undefined) this._grid.draw();
    if (this._axes !== undefined) this._axes.draw();
    if (this._ruler !== undefined) this._ruler.draw();
  }

  public intervalId: number = 0
  public isAnimated: Boolean = false

  dynamic() {
    let poligon = this._transformedPoligon.points;
    if (poligon.length < 3) throw new Error("Необходимо минимум 3 соединенные точки")
    if (this.isAnimated) {
      this.isAnimated = false
      clearTimeout(this.intervalId)
      return
    }
    this.intervalId = setInterval(() => {
      this.isAnimated = true
      this.clear()
      poligon = poligon.map((value, i) => {
        return this._basis.multiply(value);
      });

      poligon.forEach((point, i) => {
        this.drawLine(point, poligon[(i + 1) % poligon.length]);
      });

      putPoints(origChart._transformedPoligon.points, poligon)

    }, 1000)
  }

  clearTrans() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._basis = new Matrix(3, 3, [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ])
    if (this._grid !== undefined) this._grid.draw();
    if (this._axes !== undefined) this._axes.draw();
    if (this._ruler !== undefined) this._ruler.draw();
  }

  drawPoint(x: number, y: number) {
    const normX = (x - this.canvas.width / 2) / this.scale;
    const normY = (this.canvas.height / 2 - y) / this.scale;
    Chart._poligon.addPoint(normX, normY);
    this.context.beginPath();
    this.context.strokeStyle = "black"
    this.context.arc(x, y, 5, 0, 360);
    this.context.stroke();
    this.context.closePath()
  }

  drawReflectionVector(x: number, y: number) {
    const xAxis: number = this.canvas.width / 2;
    const yAxis: number = this.canvas.height / 2;

    this.context.beginPath();
    this.context.strokeStyle = "brown"
    this.context.moveTo(xAxis, yAxis);
    this.context.lineTo(x, y);
    this.context.stroke()
    this.context.closePath()
  }

  drawRotationPoint(x: number, y: number) {
    this.context.beginPath();
    this.context.strokeStyle = "green"
    this.context.arc(x, y, 5, 0, 360);
    this.context.stroke();
    this.context.closePath()
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
    this.context.strokeStyle = "black";
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

    for (let i = 0; i < this.width - 30; i = i + this.scale) {
      this.context.fillText(
        String(Math.round((i - xAxis) / this.scale)),
        i + 15,
        yAxis + 15
      );
    }

    for (let i = this.scale; i < this.height; i = i + this.scale) {
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
origChart.clear();
transChart.clear();

const drawButton: HTMLButtonElement = document.querySelector("#draw")!;
drawButton.addEventListener("click", () => {
  try {
    transChart.draw();
  } catch (error) {
    alert(error)
  }
});

const pointRotateButton: HTMLButtonElement = document.querySelector("#rotate")!;
pointRotateButton.addEventListener("click", () => {
  origCanvas.classList.remove("reflection-state")
  origCanvas.classList.remove("transfer-state")
  origCanvas?.classList.toggle("rotate-state")
});

const vectorReflectionButton: HTMLButtonElement = document.querySelector("#reflection")!;
vectorReflectionButton.addEventListener("click", () => {
  origCanvas.classList.remove("transfer-state")
  origCanvas.classList.remove("rotate-state")
  origCanvas?.classList.toggle("reflection-state")
});

const transferButton: HTMLButtonElement = document.querySelector("#transfer")!;
transferButton.addEventListener("click", () => {
  origCanvas.classList.remove("reflection-state")
  origCanvas.classList.remove("rotate-state")
  origCanvas.classList.toggle("transfer-state")
});

const connectButton: HTMLButtonElement = document.querySelector("#connect")!;
connectButton.addEventListener("click", () => {
  origChart.connect()
  transChart.connect()
  console.log(origChart.transformedPoligon.points, transChart.draw())
  putPoints(origChart.transformedPoligon.points, transChart.draw())
})

origCanvas.addEventListener("mousedown", (e) => {
  if ((e.target as HTMLElement).closest("#original-canvas")) {
    if ((e.target as HTMLElement).closest(".reflection-state")) {
      try {
        transChart.vectorReflection(e.offsetX, e.offsetY)
        //transChart.reflectionOx()
        origChart.drawReflectionVector(e.offsetX, e.offsetY);
        putPoints(origChart.transformedPoligon.points, transChart.draw())
      } catch (error) {
        alert(error)
      }
      origCanvas?.classList.toggle("reflection-state")
    }

    else if ((e.target as HTMLElement).closest(".transfer-state")) {
      origCanvas?.classList.toggle("transfer-state")
      transChart.transferSide(e.offsetX, e.offsetY)
      putPoints(origChart.transformedPoligon.points, transChart.draw())
    }

    else if ((e.target as HTMLElement).closest(".rotate-state")) {
      const angleInput: HTMLInputElement = document.querySelector("#rotate__range")!;
      let angle: number = parseInt(angleInput.value);
      try {
        transChart.pointRotate(angle, e.offsetX, e.offsetY)
        origChart.drawRotationPoint(e.offsetX, e.offsetY);
        putPoints(origChart.transformedPoligon.points, transChart.draw())
      } catch (error) {
        alert(error)
      }
      origCanvas?.classList.toggle("rotate-state")
    }
    else {
      origChart.drawPoint(e.offsetX, e.offsetY);
    }
  }
});

const scaleButton: HTMLButtonElement = document.querySelector("#scale")!;
scaleButton.addEventListener("click", () => {
  let scaleKoefInput: HTMLInputElement = document.querySelector("#scale-input")!
  let k: number = parseInt(scaleKoefInput.value)
  try {
    transChart.scaling(k)
    putPoints(origChart.transformedPoligon.points, transChart.draw())
  } catch (error) {
    alert(error)
  }
})
const clearTransButton: HTMLButtonElement = document.querySelector("#clear-changes")!;
clearTransButton.addEventListener("click", () => {
  transChart.clearTrans();
  origChart.draw()
  putPoints(origChart.transformedPoligon.points, transChart.draw())
})
const clearPoints: HTMLButtonElement = document.querySelector("#clear-points")!;
clearPoints.addEventListener("click", () => {
  origChart.clearPoints();
  transChart.clearPoints();
  putPoints([], [])
})

const dynamic: HTMLButtonElement = document.querySelector("#dynamic")!;
dynamic.addEventListener("click", () => {
  transChart.dynamic()
})

const gridCheckbox: HTMLInputElement = document.querySelector("#grid-checkbox")!
gridCheckbox.addEventListener("click", () => {
  console.log("abc")
  if (gridCheckbox.checked) {
    transChart.grid = transGrid
    origChart.grid = origGrid
  } else {
    transChart.grid = undefined
    origChart.grid = undefined
  }
  transChart.clear()
  origChart.clear()
})

const axesCheckbox: HTMLInputElement = document.querySelector("#axes-checkbox")!
axesCheckbox.addEventListener("click", () => {
  console.log("abc")
  if (axesCheckbox.checked) {
    transChart.axes = transAxes
    origChart.axes = origAxes
  } else {
    transChart.axes = undefined
    origChart.axes = undefined
  }
  transChart.clear()
  origChart.clear()
})

const rulerCheckbox: HTMLInputElement = document.querySelector("#ruler-checkbox")!
rulerCheckbox.addEventListener("click", () => {
  console.log("abc")
  if (rulerCheckbox.checked) {
    transChart.ruler = transRuler
    origChart.ruler = origRuler
  } else {
    transChart.ruler = undefined
    origChart.ruler = undefined
  }
  transChart.clear()
  origChart.clear()
})

const pointsTable: HTMLElement = document.querySelector("#points > tbody")!

function putPoints(origPoligon: Matrix[], transPoligon: Matrix[]) {
  pointsTable.innerHTML = ""
  for (let i = 0; i < origPoligon.length; i++) {
    let rw = document.createElement("tr")
    let index = document.createElement("td")
    index.innerHTML = (i + 1).toString()
    let x1 = document.createElement("td")
    x1.innerHTML = origPoligon[i].at(0, 0).toFixed(2).toString()
    let y1 = document.createElement("td")
    y1.innerHTML = origPoligon[i].at(1, 0).toFixed(2).toString()
    let x2 = document.createElement("td")
    x2.innerHTML = transPoligon[i].at(0, 0).toFixed(2).toString()
    let y2 = document.createElement("td")
    y2.innerHTML = transPoligon[i].at(1, 0).toFixed(2).toString()
    rw.appendChild(index)
    rw.appendChild(x1)
    rw.appendChild(y1)
    rw.appendChild(x2)
    rw.appendChild(y2)
    console.log(rw)
    pointsTable.appendChild(rw)
  }
}