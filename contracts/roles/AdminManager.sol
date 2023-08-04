// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AdminManager {
    /// @notice The keccak256 hash of "MANAGER_ROLE", used as a role identifier in Role-Based Access Control (RBAC)
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
}
