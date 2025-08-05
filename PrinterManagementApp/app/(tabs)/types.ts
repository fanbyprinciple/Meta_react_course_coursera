
export interface Printer {
  id: string;
  name: string;
  model: string;
  status: 'working' | 'not-working';
  location: string;
  inkLevel: number;
  remarks: string;
}
