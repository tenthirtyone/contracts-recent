// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../SingletonFactory.sol";

/// @title MockSingletonFactory
/// @notice This contract deploys new contracts using CREATE2 and computes their addresses
contract MockSingletonFactory is SingletonFactory {
    /// @notice Creates a new DcentralFactory contract instance
    constructor() {}

    /// @notice Computes the address of the contract to be deployed using the provided `salt` and `bytecode`
    /// @param salt A 32 byte value used in the address computation
    /// @param bytecode The compiled byte code of the contract to be deployed
    /// @return The address the contract will have when deployed with the provided `salt` and `bytecode`
    function computeAddress(
        bytes32 salt,
        bytes memory bytecode
    ) public view returns (address) {
        return _computeAddress(salt, address(this), bytecode);
    }

    /// @notice Computes the address of the contract to be deployed with a given `salt` and `bytecode`
    /// @dev This is a helper function and not meant to be called externally
    /// @param salt A 32 byte value used in the address computation
    /// @param deployer The address that is deploying the contract
    /// @param bytecode The compiled byte code of the contract to be deployed
    /// @return The address the contract will have when deployed by the `deployer` with the provided `salt` and `bytecode`
    function _computeAddress(
        bytes32 salt,
        address deployer,
        bytes memory bytecode
    ) internal pure returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), deployer, salt, keccak256(bytecode))
        );
        return address(uint160(uint256(hash)));
    }
}
