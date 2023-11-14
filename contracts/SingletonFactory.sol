// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/// @title EIP 2470 SingletonFactory (https://github.com/status-im/EIPs/blob/singleton-factory/EIPS/eip-2470.md)
/// @notice This contract deploys new contracts using CREATE2 and computes their addresses and should be deployed by the same key on every chain.
contract SingletonFactory {
    /// @notice Emits the address of the newly created contract
    /// @dev Emits when a contract is successfully deployed via the `deploy` function
    event ContractDeployed(address contractAddress);

    /// @notice Creates a new DcentralFactory contract instance
    constructor() {}

    /// @notice Deploys a contract with the provided `salt` and `bytecode` and emits a `ContractDeployed` event
    /// @param salt A 32 byte value used in the address computation
    /// @param bytecode The compiled byte code of the contract to be deployed
    /// @return The address of the newly deployed contract
    function deploy(
        bytes32 salt,
        bytes memory bytecode
    ) public returns (address) {
        address addr;
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        emit ContractDeployed(addr);
        return addr;
    }
}
