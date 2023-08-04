// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/proxy/Proxy.sol";

pragma solidity ^0.8.0;

/// @title ERC1155Proxy
/// @dev A proxy contract that delegates all calls to a separate implementation contract, intended for upgradeable contract patterns.
contract ERC1155Proxy is Proxy {
    /// @notice Address of the implementation contract. Immutable upon setting in the constructor.
    address public immutable implementation;

    /// @dev Constructor to set the address of the implementation contract.
    /// @param _implementationContractAddress Address of the implementation contract.
    constructor(address _implementationContractAddress) {
        require(
            _implementationContractAddress != address(0),
            "Invalid implementation address provided."
        );
        implementation = _implementationContractAddress;
    }

    function _implementation() internal view override(Proxy) returns (address) {
        return implementation;
    }
}
