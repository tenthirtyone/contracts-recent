// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC1155Singleton {
    function init(address admin, address manager) external;

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
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external;

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external;

    function burn(address account, uint256 id, uint256 amount) external;

    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external;

    function managerSafeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external;

    function managerSafeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external;

    function version() external pure returns (uint256);
}
