/**
 * Balance fetching utilities for Movement network
 * Supports legacy coins (MOVE) and Fungible Assets (PULSE, USDC)
 */

import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import {
  CoinTypeId,
  COIN_TYPES,
  getCoinTypeArg,
  getCoinSymbol,
  getCoinDecimals,
  getTokenStandard,
  getPulseContractAddress,
  getUsdcContractAddress,
} from "./tokens";

// Create an Aptos client for balance fetching
function createBalanceClient(fullnodeUrl: string): Aptos {
  const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: fullnodeUrl,
  });
  return new Aptos(config);
}

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
 * Fetch the balance for a legacy coin (e.g., MOVE)
 */
async function getLegacyCoinBalance(
  address: string,
  rpcUrl: string,
  coinTypeId: CoinTypeId,
  network: "testnet" | "mainnet"
): Promise<AccountBalance> {
  const symbol = getCoinSymbol(coinTypeId);

  try {
    const coinTypeArg = getCoinTypeArg(coinTypeId, network);

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
 * Fetch the balance for a Fungible Asset (e.g., PULSE, USDC)
 * Uses the contract's view functions directly
 */
async function getFABalance(
  address: string,
  fullnodeUrl: string,
  coinTypeId: CoinTypeId,
  network: "testnet" | "mainnet"
): Promise<AccountBalance> {
  const symbol = getCoinSymbol(coinTypeId);

  try {
    const client = createBalanceClient(fullnodeUrl);

    if (coinTypeId === COIN_TYPES.PULSE) {
      // Use PULSE contract's balance view function directly
      const pulseContract = getPulseContractAddress(network);
      if (!pulseContract) {
        return {
          balance: 0,
          balanceFormatted: "0.0000",
          exists: false,
          symbol,
        };
      }

      try {
        const balanceResult = await client.view({
          payload: {
            function: `${pulseContract}::pulse::balance`,
            typeArguments: [],
            functionArguments: [address],
          },
        });
        const balance = Number(balanceResult[0]);
        const decimals = getCoinDecimals(coinTypeId);

        return {
          balance,
          balanceFormatted: formatBalance(balance, decimals),
          exists: true,
          symbol,
        };
      } catch (error) {
        console.error("Error fetching PULSE balance:", error);
        return {
          balance: 0,
          balanceFormatted: "0.0000",
          exists: false,
          symbol,
        };
      }
    } else if (coinTypeId === COIN_TYPES.USDC) {
      // USDC.e - use primary_fungible_store::balance with the USDC metadata address
      const usdcAddress = getUsdcContractAddress(network);
      if (!usdcAddress) {
        return {
          balance: 0,
          balanceFormatted: "0.0000",
          exists: false,
          symbol,
        };
      }

      try {
        const balanceResult = await client.view({
          payload: {
            function: "0x1::primary_fungible_store::balance",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [address, usdcAddress],
          },
        });
        const balance = Number(balanceResult[0]);
        const decimals = getCoinDecimals(coinTypeId);

        return {
          balance,
          balanceFormatted: formatBalance(balance, decimals),
          exists: true,
          symbol,
        };
      } catch (error) {
        console.error("Error fetching USDC balance:", error);
        return {
          balance: 0,
          balanceFormatted: "0.0000",
          exists: false,
          symbol,
        };
      }
    }

    return {
      balance: 0,
      balanceFormatted: "0.0000",
      exists: false,
      symbol,
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} FA balance:`, error);
    return {
      balance: 0,
      balanceFormatted: "0.0000",
      exists: false,
      symbol,
    };
  }
}

/**
 * Fetch the balance for a specific coin type
 * Automatically handles both legacy coins and Fungible Assets
 * @param address - The account address
 * @param rpcUrl - The RPC endpoint URL (proxy URL for legacy coins)
 * @param coinTypeId - The coin type (0 = MOVE, 1 = PULSE, 2 = USDC)
 * @param network - The network (testnet or mainnet)
 * @param fullnodeUrl - The actual RPC URL for Aptos SDK (required for FA tokens)
 */
export async function getAccountBalance(
  address: string,
  rpcUrl: string,
  coinTypeId: CoinTypeId = COIN_TYPES.MOVE,
  network: "testnet" | "mainnet" = "testnet",
  fullnodeUrl?: string
): Promise<AccountBalance> {
  const standard = getTokenStandard(coinTypeId);

  if (standard === "fungible_asset") {
    // FA tokens require the actual fullnode URL for Aptos SDK
    const url = fullnodeUrl || rpcUrl;
    return getFABalance(address, url, coinTypeId, network);
  } else {
    return getLegacyCoinBalance(address, rpcUrl, coinTypeId, network);
  }
}

/**
 * Fetch all balances (MOVE, PULSE, USDC) for an account
 * @param address - The account address
 * @param rpcUrl - The RPC endpoint URL (proxy URL)
 * @param network - The network (testnet or mainnet)
 * @param fullnodeUrl - The actual RPC URL for Aptos SDK
 */
export async function getAllBalances(
  address: string,
  rpcUrl: string,
  network: "testnet" | "mainnet" = "testnet",
  fullnodeUrl?: string
): Promise<AllBalances> {
  const [moveBalance, pulseBalance, usdcBalance] = await Promise.all([
    getAccountBalance(address, rpcUrl, COIN_TYPES.MOVE, network, fullnodeUrl),
    getAccountBalance(address, rpcUrl, COIN_TYPES.PULSE, network, fullnodeUrl),
    getAccountBalance(address, rpcUrl, COIN_TYPES.USDC, network, fullnodeUrl),
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
 * Parse token amount to smallest unit based on decimals
 * @param amount - Amount in tokens
 * @param decimals - Number of decimals
 */
export function parseToSmallestUnit(amount: number, decimals: number = 8): number {
  return Math.floor(amount * Math.pow(10, decimals));
}

/**
 * Format balance with symbol
 * @param smallestUnit - Balance in smallest unit
 * @param coinTypeId - The coin type
 * @param displayDecimals - Number of decimal places
 */
export function formatBalanceWithSymbol(
  smallestUnit: number,
  coinTypeId: CoinTypeId,
  displayDecimals: number = 4
): string {
  const tokenDecimals = getCoinDecimals(coinTypeId);
  const formatted = formatBalance(smallestUnit, tokenDecimals, displayDecimals);
  const symbol = getCoinSymbol(coinTypeId);
  return `${formatted} ${symbol}`;
}
