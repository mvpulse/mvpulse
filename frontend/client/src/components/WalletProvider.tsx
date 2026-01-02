import { ReactNode } from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { queryClient } from "@/lib/queryClient";

interface WalletProviderProps {
  children: ReactNode;
}

// Inner component that wraps the Aptos wallet adapter
function WalletAdapterWrapper({ children }: { children: ReactNode }) {
  // Use Movement Mainnet configuration for the wallet adapter
  // The actual network (testnet/mainnet) is determined by:
  // - Browser extension wallets: detected from wallet's chainId
  // - Privy embedded wallets: controlled by our NetworkContext
  const aptosConfig = new AptosConfig({
    network: Network.MAINNET,
    fullnode: "https://mainnet.movementnetwork.xyz/v1",
  });

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={aptosConfig}
      optInWallets={["Nightly", "Petra", "Pontem Wallet"]}
      onError={(error) => {
        console.error("Wallet error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}

// Main provider that wraps NetworkProvider, PrivyProvider, and WalletAdapter
export function WalletProvider({ children }: WalletProviderProps) {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  if (!privyAppId) {
    console.warn("VITE_PRIVY_APP_ID is not set. Privy integration will not work.");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        <PrivyProvider
          appId={privyAppId || "placeholder"}
          config={{
            loginMethods: ["email", "google", "twitter", "discord", "github"],
            appearance: {
              theme: "dark",
            },
          }}
        >
          <WalletAdapterWrapper>{children}</WalletAdapterWrapper>
        </PrivyProvider>
      </NetworkProvider>
    </QueryClientProvider>
  );
}
