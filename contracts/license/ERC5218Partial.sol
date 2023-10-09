// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IERC5218Partial.sol"; // Import the IERC5218 interface

/// @title ERC5218Partial
/// @dev Partial implementation of the IERC5218 interface for NFT Rights Management.
contract ERC5218Partial is IERC5218Partial {
    /// @dev Mapping from license ID to License URI
    mapping(uint256 => string) public licenses;
    /// @dev Mapping from token ID to root license ID
    mapping(uint256 => uint256) public tokenIdToRootLicense;
    /// @dev Next available license ID
    uint256 public nextLicenseId = 1;

    /// @notice Check if a license is active.
    /// @param _licenseId The identifier for the queried license
    /// @return Whether the queried license is active
    function isLicenseActive(
        uint256 _licenseId
    ) external view override returns (bool) {
        return bytes(licenses[_licenseId]).length > 0;
    }

    /// @dev licenseId === tokenId, tokenId === autoincrement.
    /// @notice Retrieve the token identifier a license was issued upon.
    /// @param _licenseId The identifier for the queried license
    /// @return The token identifier the queried license was issued upon
    function getLicenseTokenId(
        uint256 _licenseId
    ) external pure override returns (uint256) {
        return _licenseId;
    }

    /// @notice Retrieve the URI of a license.
    /// @param _licenseId The identifier for the queried license
    /// @return The URI of the queried license
    function getLicenseURI(
        uint256 _licenseId
    ) external view override returns (string memory) {
        return licenses[_licenseId];
    }

    /// @notice Retrieve the root license identifier of an NFT.
    /// @param _tokenId The identifier for the queried NFT
    /// @return The root license identifier of the queried NFT
    function getLicenseIdByTokenId(
        uint256 _tokenId
    ) external pure override returns (uint256) {
        return _tokenId;
    }

    /// @dev Internal function to create a license.
    /// @param _tokenId The identifier for the NFT the license is issued upon
    /// @param _uri The URI of the license terms
    /// @return The identifier of the created license
    function _createLicense(
        uint256 _tokenId,
        string memory _uri
    ) internal returns (uint256) {
        licenses[_tokenId] = _uri;

        emit CreateLicense(_tokenId, _tokenId, _uri);
        return _tokenId;
    }
}
