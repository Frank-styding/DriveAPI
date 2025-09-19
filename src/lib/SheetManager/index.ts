import { Sheet } from "./sheet";
import { Spreadsheet } from "./spreadsheet";
import { Row } from "./row";
import { Template } from "./template";
import { Table } from "./table";
import { SheetCache } from "./cache";
export type { IFormat } from "./template";

export const SheetManager = {
  Sheet,
  Row,
  Template,
  Spreadsheet,
  Table,
  cache: SheetCache,
};
