// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import "../ERC1155Singleton.sol";

contract MockMarketplace is IERC1155Receiver, ERC165 {
    struct Listing {
        address seller;
        address tokenContract;
        uint256 tokenId;
        uint256 amount;
        uint256 price;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId = 1;

    function createListing(
        address tokenContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price
    ) public {
        IERC1155(tokenContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            ""
        );
        listings[nextListingId] = Listing(
            msg.sender,
            tokenContract,
            tokenId,
            amount,
            price
        );
        nextListingId++;
    }

    function createListingForAllowedUsers(
        address tokenContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        address operator
    ) public {
        IERC1155(tokenContract).safeTransferFrom(
            operator,
            address(this),
            tokenId,
            amount,
            ""
        );
        listings[nextListingId] = Listing(
            msg.sender,
            tokenContract,
            tokenId,
            amount,
            price
        );
        nextListingId++;
    }

    function buyListing(uint256 listingId) public payable {
        Listing memory listing = listings[listingId];
        require(
            msg.value >= listing.price,
            "Not enough Ether for this transaction."
        );

        delete listings[listingId];
        IERC1155(listing.tokenContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            listing.amount,
            ""
        );
        payable(listing.seller).transfer(msg.value);
    }

    function buyListingPayRoyalty(uint256 listingId) public payable {
        Listing memory listing = listings[listingId];
        require(
            msg.value >= listing.price,
            "Not enough Ether for this transaction."
        );

        delete listings[listingId];

        // Retrieve royalty information for the token
        (address royaltyReceiver, uint256 royaltyAmount) = ERC2981(
            listing.tokenContract
        ).royaltyInfo(listing.tokenId, listing.price);

        // Ensure the royalty amount does not exceed the listing price
        require(
            royaltyAmount <= listing.price,
            "Royalty exceeds listing price"
        );

        // Perform the transfer to the buyer
        IERC1155(listing.tokenContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            listing.amount,
            ""
        );

        // Pay the royalty to the royalty receiver
        if (royaltyReceiver != address(0) && royaltyAmount > 0) {
            payable(royaltyReceiver).transfer(royaltyAmount);
        }

        // Pay the remaining amount to the seller
        payable(listing.seller).transfer(listing.price - royaltyAmount);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC1155Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
