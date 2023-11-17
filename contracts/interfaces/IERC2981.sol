// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC2981 {
    function feeDenominator() external view returns (uint96);

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external;

    function deleteDefaultRoyalty() external;

    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external;

    function resetTokenRoyalty(uint256 tokenId) external;
}
