export interface QueueItem {
  data: {
    spreadsheetName?: string;
    sheetName?: string;
    data: Record<string, any>;
  };
  type: string;
  id: string;
  timestamp: number;
}
