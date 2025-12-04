/// Mock USDC token for testnet swap testing
/// This is a simple fungible token that mimics USDC behavior with 6 decimals
module contracts::mock_usdc {
    use std::string;
    use std::signer;
    use aptos_framework::coin::{Self, MintCapability, BurnCapability};

    /// Mock USDC coin type
    struct USDC {}

    /// Capabilities holder - stored at contract address
    struct Capabilities has key {
        mint_cap: MintCapability<USDC>,
        burn_cap: BurnCapability<USDC>,
    }

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_NOT_INITIALIZED: u64 = 3;

    /// Initialize the Mock USDC token
    /// Can only be called once by the contract deployer
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @contracts, E_NOT_ADMIN);
        assert!(!exists<Capabilities>(admin_addr), E_ALREADY_INITIALIZED);

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<USDC>(
            admin,
            string::utf8(b"Mock USDC"),
            string::utf8(b"USDC"),
            6, // USDC uses 6 decimals
            true, // monitor_supply
        );

        // Destroy freeze capability - we don't need it
        coin::destroy_freeze_cap(freeze_cap);

        // Store mint and burn capabilities
        move_to(admin, Capabilities {
            mint_cap,
            burn_cap,
        });
    }

    /// Mint USDC to a recipient address
    /// Can only be called by admin (for testnet faucet functionality)
    public entry fun mint(
        admin: &signer,
        recipient: address,
        amount: u64
    ) acquires Capabilities {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @contracts, E_NOT_ADMIN);
        assert!(exists<Capabilities>(admin_addr), E_NOT_INITIALIZED);

        let caps = borrow_global<Capabilities>(admin_addr);
        let coins = coin::mint(amount, &caps.mint_cap);
        coin::deposit(recipient, coins);
    }

    /// Mint USDC to the caller (faucet for anyone on testnet)
    /// Limited to 1000 USDC per call (1_000_000_000 micro-USDC)
    public entry fun faucet(account: &signer) acquires Capabilities {
        assert!(exists<Capabilities>(@contracts), E_NOT_INITIALIZED);

        let account_addr = signer::address_of(account);

        // Register the account for USDC if not already registered
        if (!coin::is_account_registered<USDC>(account_addr)) {
            coin::register<USDC>(account);
        };

        let caps = borrow_global<Capabilities>(@contracts);
        let coins = coin::mint(1_000_000_000, &caps.mint_cap); // 1000 USDC
        coin::deposit(account_addr, coins);
    }

    /// Register an account to hold USDC
    public entry fun register(account: &signer) {
        coin::register<USDC>(account);
    }

    /// Burn USDC from the caller
    public entry fun burn(account: &signer, amount: u64) acquires Capabilities {
        assert!(exists<Capabilities>(@contracts), E_NOT_INITIALIZED);

        let caps = borrow_global<Capabilities>(@contracts);
        let coins = coin::withdraw<USDC>(account, amount);
        coin::burn(coins, &caps.burn_cap);
    }

    // ======== View Functions ========

    #[view]
    /// Get the balance of USDC for an account
    public fun balance(account: address): u64 {
        if (coin::is_account_registered<USDC>(account)) {
            coin::balance<USDC>(account)
        } else {
            0
        }
    }

    #[view]
    /// Get the total supply of USDC
    public fun total_supply(): u128 {
        let supply_opt = coin::supply<USDC>();
        if (std::option::is_some(&supply_opt)) {
            std::option::extract(&mut supply_opt)
        } else {
            0
        }
    }

    #[view]
    /// Check if USDC is initialized
    public fun is_initialized(): bool {
        exists<Capabilities>(@contracts)
    }
}
