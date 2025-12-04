/// PULSE Token module for MVPulse dApp
/// A Fungible Asset token with a max supply of 1 billion PULSE
module contracts::pulse {
    use std::string::{Self};
    use std::signer;
    use std::option;
    use aptos_framework::object::{Self, Object, ExtendRef};
    use aptos_framework::fungible_asset::{Self, Metadata, MintRef, BurnRef, TransferRef, FungibleAsset};
    use aptos_framework::primary_fungible_store;

    /// Max supply: 1 billion PULSE (with 8 decimals = 100_000_000_000_000_000)
    const MAX_SUPPLY: u64 = 100_000_000_000_000_000;

    /// Faucet amount: 1000 PULSE per call
    const FAUCET_AMOUNT: u64 = 100_000_000_000; // 1000 PULSE with 8 decimals

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_EXCEEDS_MAX_SUPPLY: u64 = 2;
    const E_ALREADY_INITIALIZED: u64 = 3;
    const E_NOT_INITIALIZED: u64 = 4;

    /// Seed for creating the PULSE metadata object
    const PULSE_SEED: vector<u8> = b"PULSE_TOKEN";

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    /// Capabilities for minting and burning stored in the metadata object
    struct PulseCapabilities has key {
        mint_ref: MintRef,
        burn_ref: BurnRef,
        transfer_ref: TransferRef,
        extend_ref: ExtendRef,
        total_minted: u64,
    }

    /// Initialize PULSE token as a Fungible Asset (one-time setup by deployer)
    public entry fun initialize(account: &signer) {
        let deployer_addr = signer::address_of(account);
        assert!(deployer_addr == @contracts, E_NOT_ADMIN);

        // Create a named object for the PULSE token metadata
        let constructor_ref = object::create_named_object(account, PULSE_SEED);
        let object_signer = object::generate_signer(&constructor_ref);

        // Initialize the fungible asset with metadata
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            &constructor_ref,
            option::some((MAX_SUPPLY as u128)),  // max_supply
            string::utf8(b"Pulse Token"),        // name
            string::utf8(b"PULSE"),              // symbol
            8,                                    // decimals (same as MOVE)
            string::utf8(b""),                   // icon_uri
            string::utf8(b"https://mvpulse.xyz") // project_uri
        );

        // Generate refs for minting, burning, and transferring
        let mint_ref = fungible_asset::generate_mint_ref(&constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(&constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(&constructor_ref);
        let extend_ref = object::generate_extend_ref(&constructor_ref);

        // Store capabilities in the metadata object
        move_to(&object_signer, PulseCapabilities {
            mint_ref,
            burn_ref,
            transfer_ref,
            extend_ref,
            total_minted: 0,
        });
    }

    /// Get the PULSE metadata object
    public fun get_metadata(): Object<Metadata> {
        let metadata_addr = object::create_object_address(&@contracts, PULSE_SEED);
        object::address_to_object<Metadata>(metadata_addr)
    }

    /// Get the PULSE metadata address
    public fun get_metadata_address(): address {
        object::create_object_address(&@contracts, PULSE_SEED)
    }

    /// Mint PULSE tokens (admin only, enforces max supply of 1 billion)
    public entry fun mint(
        account: &signer,
        recipient: address,
        amount: u64
    ) acquires PulseCapabilities {
        assert!(signer::address_of(account) == @contracts, E_NOT_ADMIN);

        let metadata_addr = get_metadata_address();
        let caps = borrow_global_mut<PulseCapabilities>(metadata_addr);
        assert!(caps.total_minted + amount <= MAX_SUPPLY, E_EXCEEDS_MAX_SUPPLY);

        let fa = fungible_asset::mint(&caps.mint_ref, amount);
        primary_fungible_store::deposit(recipient, fa);

        caps.total_minted = caps.total_minted + amount;
    }

    /// Faucet - anyone can get 1000 PULSE on testnet
    public entry fun faucet(account: &signer) acquires PulseCapabilities {
        let recipient = signer::address_of(account);
        let metadata_addr = get_metadata_address();
        let caps = borrow_global_mut<PulseCapabilities>(metadata_addr);

        // Check supply limit
        let mint_amount = if (caps.total_minted + FAUCET_AMOUNT > MAX_SUPPLY) {
            MAX_SUPPLY - caps.total_minted
        } else {
            FAUCET_AMOUNT
        };

        if (mint_amount > 0) {
            let fa = fungible_asset::mint(&caps.mint_ref, mint_amount);
            primary_fungible_store::deposit(recipient, fa);
            caps.total_minted = caps.total_minted + mint_amount;
        };
    }

    /// Burn PULSE tokens (holder can burn their own tokens)
    public entry fun burn(
        account: &signer,
        amount: u64
    ) acquires PulseCapabilities {
        let metadata = get_metadata();
        let metadata_addr = get_metadata_address();
        let caps = borrow_global<PulseCapabilities>(metadata_addr);

        let fa = primary_fungible_store::withdraw(account, metadata, amount);
        fungible_asset::burn(&caps.burn_ref, fa);
    }

    /// Transfer PULSE tokens
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) {
        let metadata = get_metadata();
        primary_fungible_store::transfer(from, metadata, to, amount);
    }

    // ==================== View Functions ====================

    #[view]
    /// Get total amount of PULSE minted so far
    public fun total_minted(): u64 acquires PulseCapabilities {
        let metadata_addr = get_metadata_address();
        if (!exists<PulseCapabilities>(metadata_addr)) {
            return 0
        };
        borrow_global<PulseCapabilities>(metadata_addr).total_minted
    }

    #[view]
    /// Get the maximum supply of PULSE
    public fun max_supply(): u64 {
        MAX_SUPPLY
    }

    #[view]
    /// Get remaining mintable supply
    public fun remaining_supply(): u64 acquires PulseCapabilities {
        MAX_SUPPLY - total_minted()
    }

    #[view]
    /// Get PULSE balance for an account
    public fun balance(account: address): u64 {
        let metadata = get_metadata();
        primary_fungible_store::balance(account, metadata)
    }

    #[view]
    /// Check if PULSE is initialized
    public fun is_initialized(): bool {
        let metadata_addr = get_metadata_address();
        exists<PulseCapabilities>(metadata_addr)
    }

    // ==================== Internal Functions for other modules ====================

    /// Mint PULSE and return the FungibleAsset (for internal use by other modules)
    public(friend) fun mint_internal(amount: u64): FungibleAsset acquires PulseCapabilities {
        let metadata_addr = get_metadata_address();
        let caps = borrow_global_mut<PulseCapabilities>(metadata_addr);
        assert!(caps.total_minted + amount <= MAX_SUPPLY, E_EXCEEDS_MAX_SUPPLY);

        caps.total_minted = caps.total_minted + amount;
        fungible_asset::mint(&caps.mint_ref, amount)
    }

    /// Burn PULSE FungibleAsset (for internal use by other modules)
    public(friend) fun burn_internal(fa: FungibleAsset) acquires PulseCapabilities {
        let metadata_addr = get_metadata_address();
        let caps = borrow_global<PulseCapabilities>(metadata_addr);
        fungible_asset::burn(&caps.burn_ref, fa);
    }
}
