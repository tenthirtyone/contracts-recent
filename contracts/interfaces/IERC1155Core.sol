// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

interface IERC1155Core {
    function init(
        address owner,
        string memory contractURI_,
        string memory tokenURI_,
        string memory licenseURI_,
        uint96 defaultRoyalty
    ) external;

    function grantRole(bytes32 role, address account) external;

    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    function version() external pure returns (string memory);
}
