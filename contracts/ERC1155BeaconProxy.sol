// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

pragma solidity ^0.8.9;

/// @title ERC1155Proxy
/// @dev A proxy contract that delegates all calls to a separate implementation contract, intended for upgradeable contract patterns.
contract ERC1155BeaconProxy is BeaconProxy {
    /// @dev Constructor to set the address of the implementation contract.
    /// @param _beacon Address of the implementation contract.
    constructor(address _beacon, bytes memory data) BeaconProxy(_beacon, data) {
        require(
            _beacon != address(0),
            "Invalid implementation address provided."
        );
    }
}
