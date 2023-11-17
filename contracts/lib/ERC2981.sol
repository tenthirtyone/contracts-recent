// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../interfaces/IERC2981.sol";

/// @title ERC2981
/// @dev A simplified ERC2981
abstract contract ERC2981 is IERC2981 {
    address private _receiver;
    uint96 private _feeNumerator;

    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) external virtual {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function _setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) internal virtual {
        require(
            feeNumerator < 10000,
            "Royalty fee will exceed the sale price."
        );
        require(
            receiver != address(0),
            "Reciver address cannot be the Zero Address."
        );

        _receiver = receiver;
        _feeNumerator = feeNumerator;
    }

    function royaltyInfo(
        uint256 tokenId, // Our royalty is set for the collection but spec requires this
        uint256 salePrice
    ) public view virtual returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * _feeNumerator) / 10000;

        return (_receiver, royaltyAmount);
    }
}
