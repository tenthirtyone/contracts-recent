// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./lib/ERC1155Core.sol";
import "./interfaces/IMint.sol";

/// @title ERC1155Singleton
/// @dev A contract implementing ERC1155 with an additional initialization logic and administration functions.
contract ERC1155Singleton is ERC1155Core, IMint {
    uint256 public currentTokenId = 0;

    /// @notice Initializes the contract. Can only be done once.
    /// @param owner The address that will be set as the owner of the contract.
    /// @param contractURI_ The URI for the contract metadata.
    /// @param tokenURI_ The URI for the contract metadata.
    function init(
        address owner,
        string memory contractURI_,
        string memory tokenURI_,
        string memory licenseURI_,
        uint96 defaultRoyalty
    ) public override {
        super.init(owner, contractURI_, tokenURI_, licenseURI_, defaultRoyalty);

        currentTokenId = 0;
    }

    /// @notice Mints new tokens.
    /// @param to The address to mint tokens to.
    /// @param amount The amount of tokens to mint.
    /// @param data Additional data with no specified format.
    function mint(
        address to,
        uint256 amount,
        bytes memory data
    ) public onlyRole(MANAGER_ROLE) {
        _mint(to, currentTokenId, amount, data);

        unchecked {
            currentTokenId++;
        }
    }

    /// @notice Mints multiple tokens in a batch.
    /// @param to The address to mint tokens to.
    /// @param amounts An array with the amounts of tokens to mint for each respective ID.
    /// @param data Additional data with no specified format.
    function mintBatch(
        address to,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyRole(MANAGER_ROLE) {
        uint256[] memory ids = new uint256[](amounts.length);
        for (uint256 i = 0; i < amounts.length; i++) {
            ids[i] = currentTokenId;
            unchecked {
                currentTokenId += 1;
            }
        }
        _mintBatch(to, ids, amounts, data);
    }
}
