export type AssetType = 'stock' | 'crypto';

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  bidPrice?: number;
  askPrice?: number;
  bidSize?: number;
  askSize?: number;
  assetType?: AssetType;
}

export interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  costBasis?: number;
  side?: string;
}

export interface Order {
  id: string;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: 'draft' | 'pending' | 'confirmed' | 'cancelled' | 'filled' | 'rejected';
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  orderIntent?: OrderIntent;
}

export interface OrderIntent {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Portfolio {
  equity: number;
  cash: number;
  buyingPower: number;
  dayPL: number;
  dayPLPercent: number;
  totalPL: number;
  totalPLPercent: number;
}

export interface Activity {
  id: string;
  activity_type: string;
  transaction_time?: string;
  date?: string;
  created_at?: string;
  symbol?: string;
  side?: string;
  qty?: string;
  price?: string;
  net_amount?: string;
  description?: string;
  status?: string;
  activity_sub_type?: string;
  order_status?: string;
  type?: string;
  cum_qty?: string;
  leaves_qty?: string;
  order_id?: string;
  execution_id?: string;
  group_id?: string;
  cusip?: string;
  currency?: string;
}

export interface BarData {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface PerformanceAttribution {
  symbol: string;
  allocation: number;
  return: number;
  contribution: number;
  marketValue: number;
}
