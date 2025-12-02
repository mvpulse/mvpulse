import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WalletSelectionModalProps {
  children: React.ReactNode;
}

export function WalletSelectionModal({ children }: WalletSelectionModalProps) {
  const [open, setOpen] = useState(false);
  const { wallets, connect } = useWallet();

  // Filter and sort wallets - prioritize Nightly
  const filteredWallets = wallets
    .filter((wallet, index, self) => {
      // Remove duplicates based on wallet name
      return index === self.findIndex((w) => w.name === wallet.name);
    })
    .sort((a, b) => {
      // Nightly always first
      if (a.name.toLowerCase().includes("nightly")) return -1;
      if (b.name.toLowerCase().includes("nightly")) return 1;
      return 0;
    });

  const handleWalletSelect = async (walletName: string) => {
    try {
      await connect(walletName);
      setOpen(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to Movement Network
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {filteredWallets.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                No compatible wallets detected.
              </p>
              <a
                href="https://nightly.app/download"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Install Nightly Wallet
              </a>
            </div>
          ) : (
            filteredWallets.map((wallet) => (
              <Button
                key={wallet.name}
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => handleWalletSelect(wallet.name)}
              >
                <div className="flex items-center space-x-3">
                  {wallet.icon && (
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="w-6 h-6"
                    />
                  )}
                  <span>{wallet.name}</span>
                </div>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
