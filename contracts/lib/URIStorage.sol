// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/**
 * @title URIStorage
 * @dev Abstract contract for storing and managing URIs in ERC721-like tokens.
 */
abstract contract URIStorage {
    // Mapping from token ID to their URIs
    mapping(uint256 => string) private _tokenURIs;

    /**
     * @dev Emitted when the metadata of a token is updated.
     * @param tokenId The token ID whose metadata is updated.
     */
    event MetadataUpdate(uint256 tokenId);

    /**
     * @notice Retrieves the URI associated with a given token.
     * @dev Returns an empty string if no URI is set for the token.
     * @param tokenId The ID of the token whose URI is being queried.
     * @return string representing the URI of the given token ID.
     */
    function tokenURI(
        uint256 tokenId
    ) external view virtual returns (string memory) {
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Internal function to set the URI for a given token.
     * @dev Emits a {MetadataUpdate} event.
     * @param _tokenId The token ID for which to set the URI.
     * @param _tokenURI The URI to be set for the token.
     */
    function _setTokenURI(
        uint256 _tokenId,
        string memory _tokenURI
    ) internal virtual {
        _tokenURIs[_tokenId] = _tokenURI;
        emit MetadataUpdate(_tokenId);
    }

    /**
     * @dev Internal function to retrieve the URI for a given token.
     * @param _tokenId The token ID whose URI is being queried.
     * @return string representing the URI of the given token ID, or an empty string if none is set.
     */
    function _getTokenURI(
        uint256 _tokenId
    ) internal view virtual returns (string memory) {
        return _tokenURIs[_tokenId];
    }
}
