pragma solidity ^0.8.0;

/// @title ERC-5218: NFT Rights Management
interface IERC5218Partial {
    /// @dev This emits when a new license is created by any mechanism.
    event CreateLicense(uint256 _licenseId, uint256 _tokenId, string _uri);

    /// @notice Check if a license is active.
    /// @dev A non-existing or revoked license is inactive and this function must
    ///  return `false` upon it. Under some license terms, a license may become
    ///  inactive because some ancestral license has been revoked. In that case,
    ///  this function should return `false`.
    /// @param _licenseId The identifier for the queried license
    /// @return Whether the queried license is active
    function isLicenseActive(uint256 _licenseId) external view returns (bool);

    /// @notice Retrieve the token identifier a license was issued upon.
    /// @dev Throws unless the license is active.
    /// @param _licenseId The identifier for the queried license
    /// @return The token identifier the queried license was issued upon
    function getLicenseTokenId(
        uint256 _licenseId
    ) external view returns (uint256);

    /// @notice Retrieve the URI of a license.
    /// @dev Throws unless the license is active.
    /// @param _licenseId The identifier for the queried license
    /// @return The URI of the queried license
    function getLicenseURI(
        uint256 _licenseId
    ) external view returns (string memory);

    /// @notice Retrieve the root license identifier of an NFT.
    /// @dev Throws unless the queried NFT exists. If the NFT doesn't have a root
    ///  license tethered to it, return a special identifier not referring to any
    ///  license (such as 0).
    /// @param _tokenId The identifier for the queried NFT
    /// @return The root license identifier of the queried NFT
    function getLicenseIdByTokenId(
        uint256 _tokenId
    ) external view returns (uint256);
}
