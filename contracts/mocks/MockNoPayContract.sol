// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

contract MockNoPayContract {
    fallback() external {
        revert();
    }
}
