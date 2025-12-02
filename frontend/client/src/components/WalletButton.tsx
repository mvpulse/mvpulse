import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletSelectionModal } from "./WalletSelectionModal";
import { Wallet, LogOut, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function WalletButton() {
  const { connected, account, disconnect, wallet } = useWallet();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      toast.success("Address copied to clipboard");
    }
  };

  const viewOnExplorer = () => {
    if (account?.address) {
      window.open(
        `https://explorer.movementnetwork.xyz/account/${account.address}?network=mainnet`,
        "_blank"
      );
    }
  };

  if (!connected) {
    return (
      <WalletSelectionModal>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </Button>
      </WalletSelectionModal>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {wallet?.icon && (
            <img src={wallet.icon} alt={wallet.name} className="w-4 h-4" />
          )}
          {account?.address ? truncateAddress(account.address.toString()) : "Connected"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={viewOnExplorer} className="cursor-pointer">
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
