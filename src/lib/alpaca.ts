/**
 * Alpaca API Integration Stubs
 * 
 * These are placeholder functions for Alpaca Trading API integration.
 * Replace with actual API calls when connecting to Alpaca.
 * 
 * API Documentation: https://alpaca.markets/docs/api-documentation/
 */

export interface AlpacaConfig {
  apiKey: string;
  secretKey: string;
  paperTrading: boolean;
}

export interface AlpacaOrder {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
}

export interface AlpacaPosition {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  market_value: string;
  unrealized_pl: string;
  unrealized_plpc: string;
}

export interface AlpacaAccount {
  id: string;
  equity: string;
  cash: string;
  buying_power: string;
  portfolio_value: string;
}

const BASE_URL = {
  paper: 'https://paper-api.alpaca.markets',
  live: 'https://api.alpaca.markets',
};

const DATA_URL = 'https://data.alpaca.markets';

/**
 * Create Alpaca API client
 * @stub Replace with actual implementation
 */
export const createAlpacaClient = (config: AlpacaConfig) => {
  const baseUrl = config.paperTrading ? BASE_URL.paper : BASE_URL.live;
  
  const headers = {
    'APCA-API-KEY-ID': config.apiKey,
    'APCA-API-SECRET-KEY': config.secretKey,
    'Content-Type': 'application/json',
  };

  return {
    /**
     * Get account information
     * @stub Replace with: GET /v2/account
     */
    getAccount: async (): Promise<AlpacaAccount> => {
      console.log('[STUB] Fetching account info...');
      // TODO: Implement actual API call
      // const response = await fetch(`${baseUrl}/v2/account`, { headers });
      // return response.json();
      throw new Error('Alpaca API not configured. Set up API keys to enable trading.');
    },

    /**
     * Get all positions
     * @stub Replace with: GET /v2/positions
     */
    getPositions: async (): Promise<AlpacaPosition[]> => {
      console.log('[STUB] Fetching positions...');
      // TODO: Implement actual API call
      // const response = await fetch(`${baseUrl}/v2/positions`, { headers });
      // return response.json();
      throw new Error('Alpaca API not configured. Set up API keys to enable trading.');
    },

    /**
     * Submit an order
     * @stub Replace with: POST /v2/orders
     */
    submitOrder: async (order: AlpacaOrder): Promise<any> => {
      console.log('[STUB] Submitting order:', order);
      // TODO: Implement actual API call
      // const response = await fetch(`${baseUrl}/v2/orders`, {
      //   method: 'POST',
      //   headers,
      //   body: JSON.stringify(order),
      // });
      // return response.json();
      throw new Error('Alpaca API not configured. Set up API keys to enable trading.');
    },

    /**
     * Cancel an order
     * @stub Replace with: DELETE /v2/orders/:order_id
     */
    cancelOrder: async (orderId: string): Promise<void> => {
      console.log('[STUB] Canceling order:', orderId);
      // TODO: Implement actual API call
      // await fetch(`${baseUrl}/v2/orders/${orderId}`, {
      //   method: 'DELETE',
      //   headers,
      // });
      throw new Error('Alpaca API not configured. Set up API keys to enable trading.');
    },

    /**
     * Get real-time quote for a symbol
     * @stub Replace with: GET /v2/stocks/{symbol}/quotes/latest
     */
    getQuote: async (symbol: string): Promise<any> => {
      console.log('[STUB] Fetching quote for:', symbol);
      // TODO: Implement actual API call
      // const response = await fetch(
      //   `${DATA_URL}/v2/stocks/${symbol}/quotes/latest`,
      //   { headers }
      // );
      // return response.json();
      throw new Error('Alpaca API not configured. Set up API keys to enable trading.');
    },

    /**
     * Stream real-time market data
     * @stub Replace with WebSocket connection
     */
    streamQuotes: (symbols: string[], onQuote: (quote: any) => void) => {
      console.log('[STUB] Setting up quote stream for:', symbols);
      // TODO: Implement WebSocket connection
      // const ws = new WebSocket('wss://stream.data.alpaca.markets/v2/iex');
      // ...
      return {
        close: () => console.log('[STUB] Closing stream'),
      };
    },
  };
};

/**
 * Helper to format currency values from Alpaca
 */
export const formatAlpacaCurrency = (value: string): number => {
  return parseFloat(value);
};

/**
 * Helper to format quantity values from Alpaca
 */
export const formatAlpacaQty = (value: string): number => {
  return parseInt(value, 10);
};
