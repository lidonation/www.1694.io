import path from 'path';
import fs from 'fs';

export function readMessages(locale: string) {
  const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}
