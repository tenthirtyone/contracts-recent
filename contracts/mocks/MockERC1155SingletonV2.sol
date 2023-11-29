// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import "../ERC1155Singleton.sol";

/// @title MockERC1155SingletonV2
/// @notice This contract deploys new contracts using CREATE2 and computes their addresses
contract MockERC1155SingletonV2 is ERC1155Singleton {
    /// @notice Creates a new Dcentral1155 contract instance
    constructor() {}

    function version() public pure virtual override returns (string memory) {
        return "2";
    }
}
