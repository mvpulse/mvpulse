/**
 * Balance fetching utilities for Movement network
 * Supports multiple coin types (MOVE, PULSE)
 */

import { CoinTypeId, COIN_TYPES, getCoinTypeArg, getCoinSymbol, getCoinDecimals } from "./tokens";

export interface AccountBalance {
  balance: number; // In smallest unit (octas for MOVE/PULSE, micro for USDC)
  balanceFormatted: string; // Human readable format
  exists: boolean;
  symbol: string; // Token symbol (MOVE, PULSE, or USDC)
}

export interface AllBalances {
  [COIN_TYPES.MOVE]: AccountBalance;
  [COIN_TYPES.PULSE]: AccountBalance;
  [COIN_TYPES.USDC]: AccountBalance;
}

/**
 * Fetch the balance for a specific coin type
 * @param address - The account address
 * @param rpcUrl - The RPC endpoint URL
 * @param coinTypeId - The coin type (0 = MOVE, 1 = PULSE)
 * @param network - The network (testnet or mainnet)
 */
export async function getAccountBalance(
  address: string,
  rpcUrl: string,
  coinTypeId: CoinTypeId = COIN_TYPES.MOVE,
  network: "testnet" | "mainnet" = "testnet"
): Promise<AccountBalance> {
  const symbol = getCoinSymbol(coinTypeId);

  try {
    const coinTypeArg = getCoinTypeArg(coinTypeId, network);

    // If coin type arg is empty (PULSE not configured), return empty balance
    if (!coinTypeArg) {
      return {
        balance: 0,
        balanceFormatted: "0.0000",
        exists: false,
        symbol,
      };
    }

    const resourceType = `0x1::coin::CoinStore<${coinTypeArg}>`;
    const response = await fetch(
      `${rpcUrl}/accounts/${address}/resource/${encodeURIComponent(resourceType)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Account doesn't exist or has no coins of this type
        return {
          balance: 0,
          balanceFormatted: "0.0000",
          exists: false,
          symbol,
        };
      }
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }

    const data = await response.json();
    const balance = parseInt(data.data.coin.value, 10);
    const decimals = getCoinDecimals(coinTypeId);

    return {
      balance,
      balanceFormatted: formatBalance(balance, decimals),
      exists: true,
      symbol,
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} balance:`, error);
    return {
      balance: 0,
      balanceFormatted: "0.0000",
      exists: false,
      symbol,
    };
  }
}

/**
 * Fetch all balances (MOVE and PULSE) for an account
 * @param address - The account address
 * @param rpcUrl - The RPC endpoint URL
 * @param network - The network (testnet or mainnet)
 */
export async function getAllBalances(
  address: string,
  rpcUrl: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<AllBalances> {
  const [moveBalance, pulseBalance, usdcBalance] = await Promise.all([
    getAccountBalance(address, rpcUrl, COIN_TYPES.MOVE, network),
    getAccountBalance(address, rpcUrl, COIN_TYPES.PULSE, network),
    getAccountBalance(address, rpcUrl, COIN_TYPES.USDC, network),
  ]);

  return {
    [COIN_TYPES.MOVE]: moveBalance,
    [COIN_TYPES.PULSE]: pulseBalance,
    [COIN_TYPES.USDC]: usdcBalance,
  };
}

/**
 * Format balance from smallest unit to human readable with proper decimals
 * @param smallestUnit - Balance in smallest unit (octas for 8 decimals, micro for 6)
 * @param tokenDecimals - Number of decimals the token uses (8 for MOVE/PULSE, 6 for USDC)
 * @param displayDecimals - Number of decimal places to show (default: 4)
 */
export function formatBalance(
  smallestUnit: number,
  tokenDecimals: number = 8,
  displayDecimals: number = 4
): string {
  const divisor = Math.pow(10, tokenDecimals);
  const amount = smallestUnit / divisor;
  return amount.toFixed(displayDecimals);
}

/**
 * Parse token amount to octas
 * @param amount - Amount in tokens
 */
export function parseToOctas(amount: number): number {
  return Math.floor(amount * 100_000_000);
}

/**
 * Format balance with symbol
 * @param octas - Balance in octas
 * @param coinTypeId - The coin type
 * @param decimals - Number of decimal places
 */
export function formatBalanceWithSymbol(
  octas: number,
  coinTypeId: CoinTypeId,
  decimals: number = 4
): string {
  const formatted = formatBalance(octas, decimals);
  const symbol = getCoinSymbol(coinTypeId);
  return `${formatted} ${symbol}`;
}
