import { useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";
import { useNetwork, NetworkType, NETWORK_CONFIGS, MOVEMENT_CHAIN_IDS } from "@/contexts/NetworkContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Globe, Link } from "lucide-react";
import { toast } from "sonner";

export function NetworkSwitcher() {
  const { network, setNetwork, syncFromWalletChainId } = useNetwork();
  const { connected, wallet, network: walletNetwork } = useWallet();
  const { authenticated: privyAuthenticated } = usePrivy();

  // Detect if using browser extension wallet (not Privy)
  const isBrowserExtensionWallet = connected && !privyAuthenticated && wallet;

  // Detect current wallet network
  const walletChainId = walletNetwork?.chainId;
  const isMovementMainnet = walletChainId === MOVEMENT_CHAIN_IDS.MAINNET;
  const isMovementTestnet = walletChainId === MOVEMENT_CHAIN_IDS.TESTNET;
  const isOnMovementNetwork = isMovementMainnet || isMovementTestnet;

  // One-way sync: wallet network -> app network
  // When connected via browser extension, app follows wallet's network
  useEffect(() => {
    if (isBrowserExtensionWallet && walletChainId) {
      syncFromWalletChainId(walletChainId);
    }
  }, [isBrowserExtensionWallet, walletChainId, syncFromWalletChainId]);

  const handleNetworkChange = async (newNetwork: NetworkType) => {
    // If using browser extension wallet, don't allow manual switching
    // The app should follow the wallet's network
    if (isBrowserExtensionWallet) {
      toast.info("Network synced from wallet", {
        description: "Switch network in your wallet extension to change networks.",
      });
      return;
    }

    // Check if mainnet is available
    if (newNetwork === "mainnet" && !NETWORK_CONFIGS.mainnet.contractAddress) {
      toast.error("Mainnet not available", {
        description: "Contract has not been deployed to mainnet yet.",
      });
      return;
    }

    // For Privy users or when not connected, update the app's network context
    setNetwork(newNetwork);
    toast.success(`Switched to Movement ${NETWORK_CONFIGS[newNetwork].name}`, {
      description: `Now using ${newNetwork === "mainnet" ? "mainnet.movementnetwork.xyz" : "testnet.movementnetwork.xyz"}`,
    });
  };

  // Show warning if wallet is not on a Movement network
  const showWrongNetworkWarning = isBrowserExtensionWallet && !isOnMovementNetwork;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={network}
        onValueChange={(value) => handleNetworkChange(value as NetworkType)}
        disabled={!!isBrowserExtensionWallet}
      >
        <SelectTrigger className={`w-[140px] h-9 ${isBrowserExtensionWallet ? "opacity-80" : ""}`}>
          <div className="flex items-center gap-2">
            {isBrowserExtensionWallet ? (
              <Link className="w-4 h-4 text-primary" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="testnet">
            <div className="flex items-center gap-2">
              <span>Testnet</span>
            </div>
          </SelectItem>
          <SelectItem value="mainnet" disabled={!NETWORK_CONFIGS.mainnet.contractAddress}>
            <div className="flex items-center gap-2">
              <span>Mainnet</span>
              {!NETWORK_CONFIGS.mainnet.contractAddress && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground">
                  Soon
                </Badge>
              )}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Show "Synced" indicator when following wallet's network */}
      {isBrowserExtensionWallet && isOnMovementNetwork && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
          Synced
        </Badge>
      )}

      {/* Warning if wallet is not on Movement network */}
      {showWrongNetworkWarning && (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
          Wrong Network
        </Badge>
      )}
    </div>
  );
}
