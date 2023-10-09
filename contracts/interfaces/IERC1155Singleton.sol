// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC1155Singleton {
    function init(
        address owner,
        string memory contractURI_,
        string memory tokenURI_,
        uint96 defaultRoyalty
    ) external;

    function feeDenominator() external view returns (uint96);

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external;

    function deleteDefaultRoyalty() external;

    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external;

    function resetTokenRoyalty(uint256 tokenId) external;

    function grantRole(bytes32 role, address account) external;

    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    function mint(
        address to,
        uint256 amount,
        string memory licenseUri,
        bytes memory data
    ) external;

    function mintBatch(
        address to,
        uint256[] memory amounts,
        string[] memory licenseUri,
        bytes memory data
    ) external;

    function version() external pure returns (uint256);
}
