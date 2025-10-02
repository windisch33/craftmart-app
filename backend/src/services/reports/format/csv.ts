import { Response } from 'express';

export type CsvField<T> = {
  key: keyof T | string;
  header: string;
  transform?: (value: any, row: T) => string | number | null | undefined;
};

export function toCsv<T extends Record<string, any>>(rows: T[], fields: CsvField<T>[]): string {
  const header = fields.map((f) => f.header).join(',');
  const lines = rows.map((row) =>
    fields
      .map((f) => {
        const raw = typeof f.key === 'string' && !(f.key in row)
          ? undefined
          : (row as any)[f.key as any];
        const v = f.transform ? f.transform(raw, row) : raw;
        return csvEscape(v);
      })
      .join(',')
  );
  return [header, ...lines].join('\r\n');
}

export function sendCsv(res: Response, filename: string, csv: string) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv + '\r\n');
}

function csvEscape(value: any): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // Remove thousands separators if accidentally provided
  // Values should come as plain numbers/strings already.
  if (/[",\n\r]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
