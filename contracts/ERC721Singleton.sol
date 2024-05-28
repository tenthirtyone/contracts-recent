// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./lib/ERC721Core.sol";
import "./interfaces/IERC721Singleton.sol";

/// @title ERC721Singleton
/// @dev A contract implementing ERC721 with an additional initialization logic and administration functions.
contract ERC721Singleton is ERC721Core, IERC721Singleton, ReentrancyGuard {
    uint256 public currentTokenId = 0;

    /// @notice Initializes the contract. Can only be done once.
    /// @param owner The address that will be set as the owner of the contract.
    /// @param contractURI_ The URI for the contract metadata.
    /// @param tokenURI_ The URI for the contract metadata.
    function init(
        address owner,
        string memory name_,
        string memory symbol_,
        string memory contractURI_,
        string memory tokenURI_,
        string memory licenseURI_,
        uint96 defaultRoyalty
    ) public override {
        super.init(
            owner,
            name_,
            symbol_,
            contractURI_,
            tokenURI_,
            licenseURI_,
            defaultRoyalty
        );

        currentTokenId = 0;
    }

    /// @notice Mints new tokens to the sender
    /// @param to The address that will receive the token
    function mint(address to) public nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, currentTokenId);

        unchecked {
            currentTokenId++;
        }
    }

    /// @notice Mints multiple tokens in a batch.
    /// @param to The address to mint tokens to.
    /// @param amount The amount of tokens to mint.
    function mintBatch(
        address to,
        uint64 amount
    ) public nonReentrant onlyRole(MANAGER_ROLE) {
        for (uint256 i = 0; i < amount; i++) {
            _mint(to, currentTokenId);
            unchecked {
                currentTokenId += 1;
            }
        }
    }
}
