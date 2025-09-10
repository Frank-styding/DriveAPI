export class FormulaProcessor {
  private static initialized: boolean;

  private static regexCell: RegExp;
  private static regexColRange: RegExp;
  private static regexRowRange: RegExp;
  private static regexCellRange: RegExp;
  private static regexFinder: RegExp;

  private static colCache: Map<number, string>;
  private static letterCache: Map<string, number>;
  private static regexMixedRange: RegExp;
  // Inicializa solo una vez
  private static initialize() {
    if (this.initialized) return;

    this.regexCell = /^\$?[A-Z]+\$?\d+$/;
    this.regexColRange = /^\$?[A-Z]+:\$?[A-Z]+$/;
    this.regexRowRange = /^\d+:\d+$/;
    this.regexCellRange = /^\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+$/;
    this.regexMixedRange = /^\$?[A-Z]+\$?\d+:\$?[A-Z]+$/;

    this.regexFinder =
      /\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+|\$?[A-Z]+\$?\d+:\$?[A-Z]+|\$?[A-Z]+:\$?[A-Z]+|\d+:\d+|\$?[A-Z]+\$?\d+/g;

    this.colCache = new Map();
    this.letterCache = new Map();

    this.initialized = true;
  }

  private static colToLetter(col: number): string {
    /*    if (this.colCache.has(col)) return this.colCache.get(col)!; */
    let letter = "";
    let c = col;
    while (c > 0) {
      let rem = (c - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      c = Math.floor((c - 1) / 26);
    }
    /*     this.colCache.set(col, letter); */
    return letter;
  }

  private static letterToCol(letters: string): number {
    /*     if (this.letterCache.has(letters)) return this.letterCache.get(letters)!; */
    let col = 0;
    for (let i = 0; i < letters.length; i++) {
      col = col * 26 + (letters.charCodeAt(i) - 64);
    }
    /* this.letterCache.set(letters, col); */
    return col;
  }

  public static processFormula(
    startCol: number,
    startRow: number,
    formula: string
  ): string {
    this.initialize();

    return formula.replace(this.regexFinder, (match) => {
      // Rango con celdas (A1:C3, $A$1:B$2)
      if (this.regexCellRange.test(match)) {
        const [p1, p2] = match.split(":");
        const [, c1Abs, c1Letters, r1Abs, r1Num] = p1.match(
          /^(\$?)([A-Z]+)(\$?)(\d+)$/
        )!;
        const [, c2Abs, c2Letters, r2Abs, r2Num] = p2.match(
          /^(\$?)([A-Z]+)(\$?)(\d+)$/
        )!;
        const c1Num = this.letterToCol(c1Letters);
        const c2Num = this.letterToCol(c2Letters);
        const r1 = parseInt(r1Num);
        const r2 = parseInt(r2Num);
        const newC1 = c1Abs
          ? c1Letters
          : this.colToLetter(startCol + (c1Num - 1));
        const newR1 = r1Abs ? r1 : startRow + (r1 - 1);
        const newC2 = c2Abs
          ? c2Letters
          : this.colToLetter(startCol + (c2Num - 1));
        const newR2 = r2Abs ? r2 : startRow + (r2 - 1);
        return `${c1Abs ? "$" : ""}${newC1}${r1Abs ? "$" : ""}${newR1}:${
          c2Abs ? "$" : ""
        }${newC2}${r2Abs ? "$" : ""}${newR2}`;
      }
      // Rango mixto (ej: A2:A, D5:D)
      if (this.regexMixedRange.test(match)) {
        const [p1, p2] = match.split(":");

        // izquierda con fila
        const [, c1Abs, c1Letters, r1Abs, r1Num] = p1.match(
          /^(\$?)([A-Z]+)(\$?)(\d+)$/
        )!;

        // derecha solo columna
        const [, c2Abs, c2Letters] = p2.match(/^(\$?)([A-Z]+)$/)!;

        const c1Num = this.letterToCol(c1Letters);
        const r1 = parseInt(r1Num);
        const c2Num = this.letterToCol(c2Letters);

        const newC1 = c1Abs
          ? c1Letters
          : this.colToLetter(startCol + (c1Num - 1));
        const newR1 = r1Abs ? r1 : startRow + (r1 - 1);
        const newC2 = c2Abs
          ? c2Letters
          : this.colToLetter(startCol + (c2Num - 1));

        // ✅ ojo: la derecha también se mueve en columna
        return `${c1Abs ? "$" : ""}${newC1}${r1Abs ? "$" : ""}${newR1}:${
          c2Abs ? "$" : ""
        }${newC2}`;
      }

      // Celda simple (A1, $A1, A$1, $A$1)
      if (this.regexCell.test(match)) {
        const [, colAbs, colLetters, rowAbs, rowNum] = match.match(
          /^(\$?)([A-Z]+)(\$?)(\d+)$/
        )!;
        const colNumber = this.letterToCol(colLetters);
        const rowNumber = parseInt(rowNum);
        const newCol = colAbs ? colNumber : startCol + (colNumber - 1);
        const newRow = rowAbs ? rowNumber : startRow + (rowNumber - 1);
        return `${colAbs ? "$" : ""}${this.colToLetter(newCol)}${
          rowAbs ? "$" : ""
        }${newRow}`;
      }

      // Rango columnas completas (A:B, $A:$C)
      if (this.regexColRange.test(match)) {
        const [c1, c2] = match.split(":");
        const [, c1Abs, c1Letters] = c1.match(/^(\$?)([A-Z]+)$/)!;
        const [, c2Abs, c2Letters] = c2.match(/^(\$?)([A-Z]+)$/)!;
        const newC1 = c1Abs
          ? c1Letters
          : this.colToLetter(startCol + (this.letterToCol(c1Letters) - 1));
        const newC2 = c2Abs
          ? c2Letters
          : this.colToLetter(startCol + (this.letterToCol(c2Letters) - 1));
        return `${c1Abs ? "$" : ""}${newC1}:${c2Abs ? "$" : ""}${newC2}`;
      }

      // Rango filas completas (1:10)
      if (this.regexRowRange.test(match)) {
        const [r1, r2] = match.split(":").map(Number);
        const newR1 = startRow + (r1 - 1);
        const newR2 = startRow + (r2 - 1);
        return `${newR1}:${newR2}`;
      }

      return match;
    });
  }

  // Guardar cache en Properties
  public static saveCache() {
    const props = PropertiesService.getScriptProperties();
    props.setProperty("colCache", JSON.stringify(Array.from(this.colCache)));
    props.setProperty(
      "letterCache",
      JSON.stringify(Array.from(this.letterCache))
    );
  }

  // Cargar cache desde Properties
  public static loadCache() {
    this.initialize();
    const props = PropertiesService.getScriptProperties();
    const colCacheData = props.getProperty("colCache");
    const letterCacheData = props.getProperty("letterCache");

    if (colCacheData) {
      this.colCache = new Map(JSON.parse(colCacheData));
    }
    if (letterCacheData) {
      this.letterCache = new Map(JSON.parse(letterCacheData));
    }
  }

  // Borrar cache
  public static clearCache() {
    this.colCache.clear();
    this.letterCache.clear();
    PropertiesService.getScriptProperties().deleteProperty("colCache");
    PropertiesService.getScriptProperties().deleteProperty("letterCache");
  }
}
