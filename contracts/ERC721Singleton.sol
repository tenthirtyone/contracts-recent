// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

import "./lib/ERC721Core.sol";
import "./interfaces/IERC721Singleton.sol";

/// @title ERC721Singleton
/// @dev A contract implementing ERC721 with an additional initialization logic and administration functions.
contract ERC721Singleton is ERC721Core, IERC721Singleton {
    /// @notice Mints new tokens to the sender
    /// @param to The address that will receive the token
    function mint(address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, currentTokenId);

        unchecked {
            currentTokenId++;
        }
    }
}
