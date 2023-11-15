// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

abstract contract URIStorage {
    mapping(uint256 => string) private _tokenURIs;

    event MetadataUpdate(uint256 tokenId);

    function tokenURI(
        uint256 tokenId
    ) public view virtual returns (string memory) {
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Emits {MetadataUpdate}.
     */
    function _setTokenURI(
        uint256 _tokenId,
        string memory _tokenURI
    ) internal virtual {
        _tokenURIs[_tokenId] = _tokenURI;
        emit MetadataUpdate(_tokenId);
    }

    function _getTokenURI(
        uint256 _tokenId
    ) internal view virtual returns (string memory) {
        return _tokenURIs[_tokenId];
    }
}
