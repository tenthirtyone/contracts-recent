// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "./ERC1155Singleton.sol";
import "./ERC1155BeaconProxy.sol";

pragma solidity ^0.8.9;

contract Beacon is UpgradeableBeacon {
    event ProxyDeployed(address proxy);

    constructor(
        address implementation,
        address owner
    ) UpgradeableBeacon(implementation) {
        _transferOwnership(owner);
    }

    /// @notice Deploys a new proxy contract and initializes it with the caller as the owner. Can only be called from the singleton.
    /// @param data The manager of the new proxy contract.
    /// @return The address of the new proxy contract.
    function deployProxyContract(bytes memory data) public returns (address) {
        bytes32 salt = keccak256(data);
        bytes memory bytecodeWithoutConstructor = type(ERC1155BeaconProxy)
            .creationCode;
        bytes memory constructorArgs = abi.encode(address(this), data);
        bytes memory bytecode = abi.encodePacked(
            bytecodeWithoutConstructor,
            constructorArgs
        );

        address addr;
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        emit ProxyDeployed(addr);

        return addr;
    }
}
