// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

import "./ERC1155Singleton.sol";
import "./ERC1155BeaconProxy.sol";

contract Beacon is UpgradeableBeacon {
    event ProxyDeployed(
        address proxy,
        address implementation,
        address vault,
        address manager
    );

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
        ERC1155BeaconProxy proxy = new ERC1155BeaconProxy(address(this), data);

        return address(proxy);
    }
}
