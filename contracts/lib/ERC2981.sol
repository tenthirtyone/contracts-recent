// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../interfaces/IERC2981.sol";

/// @title ERC2981
/// @dev A simplified ERC2981
abstract contract ERC2981 is IERC2981 {
    RoyaltyInfo private _defaultRoyaltyInfo;

    function feeDenominator() external pure virtual returns (uint96) {
        return _feeDenominator();
    }

    function _feeDenominator() internal pure virtual returns (uint96) {
        return 10000;
    }

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
        uint256 denominator = _feeDenominator();

        require(
            feeNumerator < denominator,
            "Royalty fee will exceed the sale price."
        );
        require(
            receiver != address(0),
            "Reciver address cannot be the Zero Address."
        );

        _defaultRoyaltyInfo = RoyaltyInfo(receiver, feeNumerator);
    }

    function royaltyInfo(
        uint256 tokenId, // Our royalty is set for the collection but spec requires this
        uint256 salePrice
    ) public view virtual returns (address, uint256) {
        RoyaltyInfo memory royalty = _defaultRoyaltyInfo;

        uint256 royaltyAmount = (salePrice * royalty.royaltyFraction) /
            _feeDenominator();

        return (royalty.receiver, royaltyAmount);
    }
}
