/**
 * Balance fetching utilities for Movement network
 * Supports legacy coins (MOVE) and Fungible Assets (PULSE, USDC)
 */

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
 * Uses the view function API to query primary_fungible_store::balance
 */
async function getFABalance(
  address: string,
  rpcUrl: string,
  coinTypeId: CoinTypeId,
  network: "testnet" | "mainnet"
): Promise<AccountBalance> {
  const symbol = getCoinSymbol(coinTypeId);

  try {
    let metadataAddress: string;

    if (coinTypeId === COIN_TYPES.PULSE) {
      // For PULSE, we need to get the FA metadata address from the contract
      const pulseContract = getPulseContractAddress(network);
      if (!pulseContract) {
        return {
          balance: 0,
          balanceFormatted: "0.0000",
          exists: false,
          symbol,
        };
      }

      // First, get the PULSE metadata address using view function
      const metadataResponse = await fetch(`${rpcUrl}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          function: `${pulseContract}::pulse::get_metadata_address`,
          type_arguments: [],
          arguments: [],
        }),
      });

      if (!metadataResponse.ok) {
        // PULSE might not be initialized yet
        return {
          balance: 0,
          balanceFormatted: "0.0000",
          exists: false,
          symbol,
        };
      }

      const metadataResult = await metadataResponse.json();
      metadataAddress = metadataResult[0];
    } else if (coinTypeId === COIN_TYPES.USDC) {
      // USDC.e FA metadata is at the contract address directly
      metadataAddress = getUsdcContractAddress(network);
      if (!metadataAddress) {
        return {
          balance: 0,
          balanceFormatted: "0.0000",
          exists: false,
          symbol,
        };
      }
    } else {
      return {
        balance: 0,
        balanceFormatted: "0.0000",
        exists: false,
        symbol,
      };
    }

    // Now fetch the balance using primary_fungible_store::balance view function
    const balanceResponse = await fetch(`${rpcUrl}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        function: "0x1::primary_fungible_store::balance",
        type_arguments: ["0x1::fungible_asset::Metadata"],
        arguments: [address, metadataAddress],
      }),
    });

    if (!balanceResponse.ok) {
      // Account might not have a store for this FA yet
      return {
        balance: 0,
        balanceFormatted: "0.0000",
        exists: false,
        symbol,
      };
    }

    const balanceResult = await balanceResponse.json();
    const balance = parseInt(balanceResult[0], 10);
    const decimals = getCoinDecimals(coinTypeId);

    return {
      balance,
      balanceFormatted: formatBalance(balance, decimals),
      exists: true,
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
 * @param rpcUrl - The RPC endpoint URL
 * @param coinTypeId - The coin type (0 = MOVE, 1 = PULSE, 2 = USDC)
 * @param network - The network (testnet or mainnet)
 */
export async function getAccountBalance(
  address: string,
  rpcUrl: string,
  coinTypeId: CoinTypeId = COIN_TYPES.MOVE,
  network: "testnet" | "mainnet" = "testnet"
): Promise<AccountBalance> {
  const standard = getTokenStandard(coinTypeId);

  if (standard === "fungible_asset") {
    return getFABalance(address, rpcUrl, coinTypeId, network);
  } else {
    return getLegacyCoinBalance(address, rpcUrl, coinTypeId, network);
  }
}

/**
 * Fetch all balances (MOVE, PULSE, USDC) for an account
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
