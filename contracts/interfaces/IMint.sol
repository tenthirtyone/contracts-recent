// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

interface IMint {
    function mint(address to, uint256 amount, bytes memory data) external;

    function mintBatch(
        address to,
        uint256[] memory amounts,
        bytes memory data
    ) external;
}
