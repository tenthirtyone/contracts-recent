// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

interface IERC1155LazyMint {
    struct NFTVoucher {
        uint256 tokenId;
        uint256 minPrice;
        string uri;
    }

    function redeem(
        address redeemer,
        NFTVoucher calldata voucher,
        bytes memory signature
    ) external payable returns (uint256);
}
