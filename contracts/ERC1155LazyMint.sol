// SPDX-License-Identifier: MIT
// Based on https://github.com/yusefnapora/lazy-minting

pragma solidity ^0.8.22;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./lib/ERC1155Core.sol";
import "./lib/URIStorage.sol";
import "./interfaces/IERC1155LazyMint.sol";

/// @title ERC1155LazyMint
/// @dev A contract implementing ERC1155 with an additional initialization logic, lazy minting, and administration functions.
contract ERC1155LazyMint is
    IERC1155LazyMint,
    ERC1155Core,
    URIStorage,
    ReentrancyGuard
{
    using ECDSA for bytes32;

    mapping(uint256 => uint256) _maxSupply;

    /// @notice Redeems an NFTVoucher for an actual NFT, creating it in the process.
    /// @param redeemer The address of the account which will receive the NFT upon success.
    /// @param voucher An NFTVoucher that describes the NFT to be redeemed.
    /// @param signature An EIP712 signature of the voucher, produced by the NFT creator.
    function redeem(
        address redeemer,
        uint256 quantity,
        NFTVoucher calldata voucher,
        bytes memory signature
    ) public payable nonReentrant returns (uint256) {
        // make sure signature is valid and get the address of the signer
        address signer = _verify(voucher, signature);

        // require the voucher chain id is the same as the current network chain id
        require(voucher.chainId == block.chainid);

        require(voucher.maxSupply > 0);
        require(quantity > 0);
        // make sure that the signer is authorized to mint NFTs
        require(hasRole(MANAGER_ROLE, signer));

        if (_maxSupply[voucher.tokenId] == 0) {
            _maxSupply[voucher.tokenId] = voucher.maxSupply;
        }

        require(
            (totalSupply(voucher.tokenId) + quantity) <=
                _maxSupply[voucher.tokenId]
        );

        // make sure that the redeemer is paying enough to cover the buyer's cost
        require(msg.value >= (quantity * voucher.minPrice));

        // first assign the token to the signer, to establish provenance on-chain
        _mint(signer, voucher.tokenId, quantity, signature); // data is optional, passing signature saves on creating a new var
        _setTokenURI(voucher.tokenId, voucher.uri);

        // transfer the token to the redeemer
        _safeTransferFrom(
            signer,
            redeemer,
            voucher.tokenId,
            quantity,
            signature
        );

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
                            "NFTVoucher(uint256 tokenId,uint256 minPrice,string uri,uint256 maxSupply,uint256 chainId,address recipient)"
                        ),
                        voucher.tokenId,
                        voucher.minPrice,
                        keccak256(bytes(voucher.uri)),
                        voucher.maxSupply,
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
