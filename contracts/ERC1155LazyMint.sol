// SPDX-License-Identifier: MIT
// Based on https://github.com/yusefnapora/lazy-minting

pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./lib/ERC1155Core.sol";
import "./lib/URIStorage.sol";
import "./interfaces/IERC1155LazyMint.sol";

/// @title ERC1155LazyMint
/// @dev A contract implementing ERC1155 with an additional initialization logic and administration functions.
/// Because this is an 1155 contract, and
contract ERC1155LazyMint is IERC1155LazyMint, ERC1155Core, URIStorage {
    using ECDSA for bytes32;

    /// @notice Initializes the contract. Can only be done once.
    /// @param owner The address that will be set as the owner of the contract.
    /// @param contractURI_ The URI for the contract metadata.
    /// @param tokenURI_ The URI for the contract metadata.
    function init(
        address owner,
        string memory contractURI_,
        string memory tokenURI_,
        string memory licenseURI_,
        uint96 defaultRoyalty
    ) public override {
        super.init(owner, contractURI_, tokenURI_, licenseURI_, defaultRoyalty);

        _grantRole(MANAGER_ROLE, owner);
    }

    /// @notice Redeems an NFTVoucher for an actual NFT, creating it in the process.
    /// @param redeemer The address of the account which will receive the NFT upon success.
    /// @param voucher An NFTVoucher that describes the NFT to be redeemed.
    /// @param signature An EIP712 signature of the voucher, produced by the NFT creator.
    function redeem(
        address redeemer,
        NFTVoucher calldata voucher,
        bytes memory signature
    ) public payable returns (uint256) {
        // make sure signature is valid and get the address of the signer
        address signer = _verify(voucher, signature);

        // make sure that the signer is authorized to mint NFTs
        require(
            hasRole(MANAGER_ROLE, signer),
            "Signature invalid or unauthorized"
        );

        // make sure that the redeemer is paying enough to cover the buyer's cost
        require(msg.value >= voucher.minPrice, "Insufficient funds to redeem");

        // first assign the token to the signer, to establish provenance on-chain
        _mint(signer, voucher.tokenId, 1, signature); // data is optional, passing signature saves on creating a new var
        _setTokenURI(voucher.tokenId, voucher.uri);

        // transfer the token to the redeemer
        _safeTransferFrom(signer, redeemer, voucher.tokenId, 1, signature);

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
                            "NFTVoucher(uint256 tokenId,uint256 minPrice,string uri)"
                        ),
                        voucher.tokenId,
                        voucher.minPrice,
                        keccak256(bytes(voucher.uri))
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
    ) internal view returns (address) {
        bytes32 digest = _hash(voucher);
        return digest.toEthSignedMessageHash().recover(signature);
    }

    function _setTokenURI(
        uint256 tokenId,
        string memory _tokenURI
    ) internal virtual override(URIStorage) {
        URIStorage._setTokenURI(tokenId, _tokenURI);
    }

    function tokenURI(
        uint256 _tokenId
    ) public view override(ERC1155Core, URIStorage) returns (string memory) {
        return _getTokenURI(_tokenId);
    }
}
