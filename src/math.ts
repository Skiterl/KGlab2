export class Vector {
  private _values: number[];

  constructor(values?: number[]) {
    this._values = new Array<number>((values || [0]).length).fill(0);

    if (values) {
      this._values = values;
    }
  }

  get rows() {
    return this.values.length;
  }

  get values() {
    return this._values;
  }

  set values(newValues: number[]) {
    const minSize = Math.min(this.values.length, newValues.length);
    for (let i = 0; i < minSize; i++) {
      this.values[i] = newValues[i];
    }
  }

  angleFrom(vector: Vector): number {
    if (this.rows !== vector.rows) throw new Error("Different dimensions");
    const dot = this.dot(vector);
    const cos = dot / (this.length() * vector.length());
    return Math.acos(cos);
  }

  subtract(vector: Vector): Vector {
    if (this.rows !== vector.rows)
      throw new Error("Vectors don't have the same dimension!");
    return this.operateOnAllValues((val, i) => val - vector.at(i));
  }

  distanceFrom(vector: Vector): number {
    if (this.rows !== vector.rows) throw new Error("Different dimensions");
    return this.subtract(vector).length();
  }

  private operateOnAllValues(
    operation: (val: number, index: number) => number
  ): Vector {
    return new Vector(this.values.map(operation));
  }

  normalize(): Vector {
    const vectorLength = this.length();
    return this.operateOnAllValues((val) => val / vectorLength);
  }

  round(): Vector {
    if (this.rows === 0) throw new Error("Cannot round an empty vector!");
    return this.operateOnAllValues((val) => Math.round(val));
  }

  scale(scale: number): Vector {
    return this.operateOnAllValues((val) => val * scale);
  }

  cross(vector: Vector): Vector {
    if (this.rows < 3 || vector.rows < 3)
      throw new Error("Cross product is possible on 3D vectors only");
    const crossValues = new Array<number>(3);
    crossValues[0] = this.at(1) * vector.at(2) - this.at(2) * vector.at(1);
    crossValues[1] = this.at(2) * vector.at(0) - this.at(0) * vector.at(2);
    crossValues[2] = this.at(0) * vector.at(1) - this.at(1) * vector.at(0);
    return new Vector(crossValues);
  }

  at(row: number): number {
    return this.values[row];
  }

  squaredLength(): number {
    return this.dot(this);
  }

  length(): number {
    return Math.sqrt(this.squaredLength());
  }

  dot(vector: Vector): number {
    return this.values.reduce((res, val, i) => res + val * vector.at(i));
  }

  indexOf(value: number): number {
    return this.values.indexOf(value);
  }

  reset(): void {
    this.values = this.values.fill(0);
  }

  min(): number {
    if (this.rows === 0) throw new Error("Length = 0");
    return Math.min(...this.values);
  }

  max(): number {
    if (this.rows === 0) throw new Error("Length = 0");
    return Math.max(...this.values);
  }
}

export class Matrix {
  private _rows: number;
  private _columns: number;
  private _values: number[][];

  get rows(): number {
    return this._rows;
  }
  get columns(): number {
    return this._columns;
  }
  get values(): number[][] {
    return this._values;
  }

  set values(newValues: number[][]) {
    const minRow = Math.min(newValues.length, this.rows);
    const minCol = Math.min(newValues[0].length, this.columns);
    for (let i = 0; i < minRow; i++) {
      for (let j = 0; j < minCol; j++) {
        this.values[i][j] = newValues[i][j];
      }
    }
  }

  constructor(rows: number, columns: number, values?: number[][]) {
    this._rows = Math.max(rows, 1);
    this._columns = Math.max(columns, 1);

    this._values = new Array<number[]>(this._rows)
      .fill([])
      .map(() => new Array<number>(this._columns).fill(0));
    if (values) {
      this.values = values;
    }
  }

  at(row: number, col: number): number {
    return this.values[row][col];
  }
  reset(): void {
    this.values = this.values.map((row) => row.map(() => 0));
  }
  addColumn(): Matrix {
    return new Matrix(this.rows, this.columns + 1, this.values);
  }
  addRow(): Matrix {
    return new Matrix(this.rows + 1, this.columns, this.values);
  }
  equals(mat: Matrix): boolean {
    return (
      this.columns === mat.columns &&
      this.rows === mat.rows &&
      this.values.reduce(
        (eql: boolean, row, i) =>
          eql &&
          row.reduce(
            (eql2: boolean, val, j) => eql2 && val === mat.at(i, j),
            eql
          ),
        true
      )
    );
  }
  setAsIdentity() {
    if (this.rows != this.columns) throw new Error("Dimension error!");
    this.values.forEach((row, i) => {
      row.forEach((val, j) => {
        this.values[i][j] = i === j ? 1 : 0;
      });
    });
    return this;
  }
  static identity(dimension: number): Matrix {
    if (dimension < 1) throw new Error("Dimension Error!");
    return new Matrix(dimension, dimension).setAsIdentity();
  }

  multiply(mat: Matrix): Matrix {
    if (this.columns !== mat.rows) throw new Error("Dimension error!");
    const resMatrix = new Matrix(this.rows, mat.columns);
    resMatrix.values = this.values.map((row, i) => {
      return row.map((val, j) => {
        return this.values[i].reduce(
          (sum, el, k) => sum + el * mat.at(k, j),
          0
        );
      });
    });
    return resMatrix;
  }
  transpose(): Matrix {
    return new Matrix(
      this.columns,
      this.rows,
      new Array<number[]>(this.columns)
        .fill([])
        .map((row, i) =>
          new Array<number>(this.rows).fill(0).map((c, j) => this.at(j, i))
        )
    );
  }
}
