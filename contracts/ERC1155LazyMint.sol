// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "./lib/ERC1155Core.sol";
import "./interfaces/ILazyMint.sol";

/// @title ERC1155LazyMint
/// @dev A contract implementing ERC1155 with an additional initialization logic and administration functions.
/// Because this is an 1155 contract, and
contract ERC1155LazyMint is ERC1155Core, ILazyMint, ERC1155Supply {
    // TokenId to maxSupply
    mapping(uint256 => uint256) maxSupply;

    function redeem(
        address redeemer,
        NFTVoucher calldata voucher,
        bytes memory signature
    ) public payable {}

    /**
     * @dev Override _beforeTokenTransfer.
     * This function combines the logic of _beforeTokenTransfer from both ERC1155 and ERC1155Supply.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /// @notice Returns true if this contract implements the interface defined by `interfaceId`.
    /// @param interfaceId The interface
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, ERC1155Core) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Returns whether the operator is authorized to manage the tokens of the account.
    /// Allows Seaport Address by default.
    /// @dev Overrides the default behavior for certain operator addresses
    /// @param account The address of the token holder
    /// @param operator The address of the operator to check
    /// @return True if the operator is approved for all tokens of the account, false otherwise
    function isApprovedForAll(
        address account,
        address operator
    ) public view virtual override(ERC1155, ERC1155Core) returns (bool) {
        if (operator == 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC) return true;

        return super.isApprovedForAll(account, operator);
    }
}
