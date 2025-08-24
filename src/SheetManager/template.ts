import { SheetCache } from "./cache";
import { FormulaProcessor } from "./formula";

export interface IFormat {
  col?: number;
  startRow?: number;
  cellRow?: number;
  cellCol?: number;
  numberFormat?: string;
  conditionalRules?: {
    type:
      | "lessThan"
      | "greaterThan"
      | "equalTo"
      | "between"
      | "notEqualTo"
      | "textContains"
      | "textStartsWith"
      | "textEndsWith"
      | "textEqualTo"
      | "textIsEmpty"
      | "textIsNotEmpty";
    value?: string | number;
    min?: number;
    max?: number;
    background?: string;
    fontColor?: string;
  }[];
}
export class Template {
  private constructor() {}
  static applyColumnFormats(
    spreadsheetName: string,
    sheetName: string,
    formats: IFormat[]
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId)
      throw new Error(`Spreadsheet "${spreadsheetName}" does not exist.`);
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" does not exist.`);
    // Get existing conditional rules from the sheet
    const rules = sheet.getConditionalFormatRules();

    formats.forEach((fmt) => {
      let range: GoogleAppsScript.Spreadsheet.Range | undefined;
      if (fmt.startRow && fmt.col) {
        const numRows = sheet.getMaxRows() - fmt.startRow + 1;
        range = sheet.getRange(fmt.startRow, fmt.col, numRows);
      } else {
        if (fmt.cellCol && fmt.cellRow) {
          range = sheet.getRange(fmt.cellRow, fmt.cellCol, 1, 1);
        }
      }

      if (fmt.numberFormat) {
        range?.setNumberFormat(fmt.numberFormat);
      }

      if (fmt.conditionalRules) {
        fmt.conditionalRules.forEach((rule) => {
          if (!range) return;
          let builder = SpreadsheetApp.newConditionalFormatRule().setRanges([
            range,
          ]);

          switch (rule.type) {
            case "lessThan":
              builder = builder.whenNumberLessThan(Number(rule.value));
              break;
            case "greaterThan":
              builder = builder.whenNumberGreaterThan(Number(rule.value));
              break;
            case "equalTo":
              if (typeof rule.value === "string") {
                builder = builder.whenTextEqualTo(String(rule.value));
              } else {
                builder = builder.whenNumberEqualTo(Number(rule.value));
              }
              break;
            case "notEqualTo":
              if (typeof rule.value === "string") {
                const a1 = range.getA1Notation();
                builder = builder.whenFormulaSatisfied(
                  `=${a1}<>"${rule.value}"`
                );
              } else {
                builder = builder.whenNumberNotEqualTo(Number(rule.value));
              }
              break;
            case "between":
              builder = builder.whenNumberBetween(
                Number(rule.min),
                Number(rule.max)
              );
              break;

            case "textContains":
              builder = builder.whenTextContains(String(rule.value));
              break;
            case "textStartsWith":
              builder = builder.whenTextStartsWith(String(rule.value));
              break;
            case "textEndsWith":
              builder = builder.whenTextEndsWith(String(rule.value));
              break;
            case "textEqualTo":
              builder = builder.whenTextEqualTo(String(rule.value));
              break;
            case "textIsEmpty":
              {
                const a1 = range.getA1Notation();
                builder = builder.whenFormulaSatisfied(`=ISBLANK(${a1})`);
              }
              break;
            case "textIsNotEmpty":
              {
                const a1 = range.getA1Notation();
                builder = builder.whenFormulaSatisfied(`=NOT(ISBLANK(${a1}))`);
              }
              break;
          }

          if (rule.background) builder = builder.setBackground(rule.background);
          if (rule.fontColor) builder = builder.setFontColor(rule.fontColor);

          rules.push(builder.build());
        });
      }
    });

    // Save back all rules (old + new)
    sheet.setConditionalFormatRules(rules);
  }

  static createWithTemplate(
    spreadsheetName: string,
    sheetName: string,
    startCol: number,
    startRow: number,
    template: string[][],
    formats: {
      range: [number, number, number, number];
      formats: { type: string; data: Record<string, any> }[];
    }[] = []
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId)
      throw new Error(`Spreadsheet "${spreadsheetName}" does not exist.`);
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" does not exist.`);
    if (!template || template.length === 0 || !template[0].length) {
      throw new Error("Template cannot be empty.");
    }
    const rows = template.length;
    const cols = template[0].length;

    const processedTemplate = template.map((row) =>
      row.map((cell) =>
        cell && cell.startsWith("formula:")
          ? "=" +
            FormulaProcessor.processFormula(startCol, startRow, cell.slice(8))
          : cell || ""
      )
    );

    sheet.getRange(startRow, startCol, rows, cols).setValues(processedTemplate);

    for (const {
      range: [colOffset, rowOffset, cCount, rCount],
      formats: formatList,
    } of formats) {
      const range = sheet.getRange(
        startRow + rowOffset,
        startCol + colOffset,
        rCount,
        cCount
      );

      for (const format of formatList) {
        switch (format.type) {
          case "background":
            range.setBackground(format.data.color || null);
            break;

          case "border":
            range.setBorder(
              ...((format.data.borders || []) as [
                boolean,
                boolean,
                boolean,
                boolean,
                boolean,
                boolean
              ])
            );
            break;

          case "font":
            if (format.data.bold !== undefined)
              range.setFontWeight(format.data.bold ? "bold" : "normal");
            if (format.data.size !== undefined)
              range.setFontSize(format.data.size);
            if (format.data.color) range.setFontColor(format.data.color);
            break;

          case "align":
            if (format.data.horizontal)
              range.setHorizontalAlignment(format.data.horizontal);
            if (format.data.vertical)
              range.setVerticalAlignment(format.data.vertical);
            break;
        }
      }
    }
  }
}
