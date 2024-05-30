// SPDX-License-Identifier: MIT
// Based on https://github.com/yusefnapora/lazy-minting

pragma solidity ^0.8.22;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";
import "./lib/ERC721Core.sol";
import "./interfaces/IERC721LazyMint.sol";

/// @title ERC721LazyMint
/// @dev A contract implementing ERC1155 with an additional initialization logic, lazy minting, and administration functions.
contract ERC721LazyMint is IERC721LazyMint, ERC721Core, ReentrancyGuard {
    using ECDSA for bytes32;

    mapping(uint256 => uint256) _maxSupply;

    /// @notice Redeems an NFTVoucher for an actual NFT, creating it in the process.
    /// @param redeemer The address of the account which will receive the NFT upon success.
    /// @param voucher An NFTVoucher that describes the NFT to be redeemed.
    /// @param signature An EIP712 signature of the voucher, produced by the NFT creator.
    function redeem(
        address redeemer,
        NFTVoucher calldata voucher,
        bytes memory signature
    ) public payable nonReentrant returns (uint256) {
        // make sure signature is valid and get the address of the signer
        address signer = _verify(voucher, signature);

        // require the voucher chain id is the same as the current network chain id
        require(voucher.chainId == block.chainid);

        // make sure that the signer is authorized to mint NFTs
        require(hasRole(MANAGER_ROLE, signer));

        // make sure that the redeemer is paying enough to cover the buyer's cost
        require(msg.value >= voucher.minPrice);

        // first assign the token to the signer, to establish provenance on-chain
        _mint(signer, voucher.tokenId);

        // transfer the token to the redeemer
        _safeTransfer(signer, redeemer, voucher.tokenId, signature); // data is optional, passing signature saves on creating a new var

        // Transfer the eth to the recipient
        payable(voucher.recipient).transfer(msg.value); // msg.value can be more than quantity * minPrice
        return voucher.tokenId;
    }

    /// @notice Returns a hash of the given NFTVoucher, prepared using EIP712 typed data hashing rules.
    /// @param voucher An NFTVoucher to hash.
    function _hash(
        NFTVoucher calldata voucher
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256(
                            "NFTVoucher(uint256 tokenId,uint256 minPrice,uint256 chainId,address recipient)"
                        ),
                        voucher.tokenId,
                        voucher.minPrice,
                        voucher.chainId,
                        voucher.recipient
                    )
                )
            );
    }

    /// @notice Verifies the signature for a given NFTVoucher, returning the address of the signer.
    /// @dev Will revert if the signature is invalid. Does not verify that the signer is authorized to mint NFTs.
    /// @param voucher An NFTVoucher describing an unminted NFT.
    /// @param signature An EIP712 signature of the given voucher.
    function _verify(
        NFTVoucher calldata voucher,
        bytes memory signature
    ) public view returns (address) {
        bytes32 digest = _hash(voucher);
        return digest.toEthSignedMessageHash().recover(signature);
    }
}
