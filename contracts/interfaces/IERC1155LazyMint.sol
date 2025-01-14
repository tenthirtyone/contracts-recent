// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

interface IERC1155LazyMint {
    struct SFTVoucher {
        uint256 tokenId;
        uint256 minPrice;
        string uri;
        uint256 maxSupply;
        uint256 chainId;
        address recipient;
    }

    function redeem(
        address redeemer,
        uint256 quantity,
        SFTVoucher calldata voucher,
        bytes memory signature
    ) external payable returns (uint256);
}
