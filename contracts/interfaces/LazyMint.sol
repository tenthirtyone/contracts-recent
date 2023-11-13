pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface LazyMint {
    struct NFTVoucher {
        uint256 tokenId;
        uint256 minPrice;
        address to;
        string ipfsTokenUri;
    }

    function redeem(
        address redeemer,
        NFTVoucher calldata voucher,
        bytes memory signature
    ) public payable;


    function _verify(
        NFTVoucher memory voucher,
        bytes memory signature
    ) private returns (address signer) 
}
