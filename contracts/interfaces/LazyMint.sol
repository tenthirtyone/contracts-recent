pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface LazyMint {
    struct NFTVoucher {
        uint256 minPrice;
        string uri;
    }

    function redeem(
        address redeemer,
        NFTVoucher calldata voucher,
        bytes memory signature
    ) external payable;
}
