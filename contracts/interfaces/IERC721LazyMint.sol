// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

interface IERC721LazyMint {
    struct NFTVoucher {
        uint256 tokenId;
        uint256 minPrice;
        string uri;
        uint256 maxSupply;
        address recipient;
    }

    function redeem(
        address redeemer,
        NFTVoucher calldata voucher,
        bytes memory signature
    ) external payable returns (uint256);
}