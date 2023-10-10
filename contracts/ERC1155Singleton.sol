// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

import "./interfaces/IERC1155Singleton.sol";
import "./license/ERC5218Partial.sol";

/// @title ERC1155Singleton
/// @dev A contract implementing ERC1155 with an additional initialization logic and administration functions.
contract ERC1155Singleton is
    ERC165,
    IERC1155Singleton,
    ERC1155,
    ERC2981,
    ERC5218Partial,
    AccessControl
{
    uint256 public currentTokenId = 0;
    string public contractURI;

    /// @notice The keccak256 hash of "MANAGER_ROLE", used as a role identifier in Role-Based Access Control (RBAC)
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    /// @notice Indicates if the contract has been initialized.
    bool public didInit = false;
    /// @notice Map to track registered interfaces
    mapping(bytes4 => bool) private _supportedInterfaces;
    /// @notice Emitted when init is called.
    event Initialized(
        address proxyContractAddress,
        address owner,
        address manager
    );

    /// @dev Contract constructor. Sets token URI and transfers ownership to zero address to establish a singleton mode.
    constructor()
        ERC1155("https://dcentral.me/api/assets/{chainId}/{address}/{id}.json")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, address(0));
        _grantRole(MANAGER_ROLE, address(0));
        // Singleton
        didInit = true;
    }

    /// @notice Initializes the contract. Can only be done once.
    /// @param owner The address that will be set as the owner of the contract.
    /// @param contractURI_ The URI for the contract metadata.
    /// @param tokenURI_ The URI for the contract metadata.
    /// @param defaultRoyalty The royalty payment in base points.
    function init(
        address owner,
        string memory contractURI_,
        string memory tokenURI_,
        uint96 defaultRoyalty
    ) public {
        require(!didInit, "Contract has already been initialized");
        didInit = true;

        _setContractURI(contractURI_);
        _setURI(tokenURI_);

        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(MANAGER_ROLE, owner);

        _setDefaultRoyalty(owner, defaultRoyalty);

        currentTokenId = 0;
    }

    /// @notice Mints new tokens.
    /// @param to The address to mint tokens to.
    /// @param amount The amount of tokens to mint.
    /// @param data Additional data with no specified format.
    function mint(
        address to,
        uint256 amount,
        string memory licenseUri,
        bytes memory data
    ) public onlyRole(MANAGER_ROLE) {
        _mint(to, currentTokenId, amount, data);
        _createLicense(currentTokenId, licenseUri);

        unchecked {
            currentTokenId++;
        }
    }

    /// @notice Mints multiple tokens in a batch.
    /// @param to The address to mint tokens to.
    /// @param amounts An array with the amounts of tokens to mint for each respective ID.
    /// @param data Additional data with no specified format.
    function mintBatch(
        address to,
        uint256[] memory amounts,
        string[] memory licenseUris,
        bytes memory data
    ) public onlyRole(MANAGER_ROLE) {
        uint256[] memory ids = new uint256[](amounts.length);
        for (uint256 i = 0; i < amounts.length; i++) {
            ids[i] = currentTokenId;
            _createLicense(currentTokenId, licenseUris[i]);
            unchecked {
                currentTokenId += 1;
            }
        }
        _mintBatch(to, ids, amounts, data);
    }

    /// @notice Sets the default royalty for all tokens
    /// @dev Can only be called by an account with the MANAGER_ROLE
    /// @param receiver The address that will receive the royalty
    /// @param feeNumerator The numerator for calculating the royalty fee
    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) public onlyRole(MANAGER_ROLE) {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /// @notice Gets the denominator for the fee calculation
    /// @return The denominator for the fee calculation
    function feeDenominator() public pure returns (uint96) {
        return _feeDenominator();
    }

    /// @notice Deletes the default royalty for all tokens
    /// @dev Can only be called by an account with the MANAGER_ROLE
    function deleteDefaultRoyalty() public onlyRole(MANAGER_ROLE) {
        _deleteDefaultRoyalty();
    }

    /// @notice Sets the royalty for a specific token
    /// @dev Can only be called by an account with the MANAGER_ROLE
    /// @param tokenId The ID of the token
    /// @param receiver The address that will receive the royalty
    /// @param feeNumerator The numerator for calculating the royalty fee
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) public onlyRole(MANAGER_ROLE) {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /// @notice Resets the royalty for a specific token
    /// @dev Can only be called by an account with the MANAGER_ROLE
    /// @param tokenId The ID of the token
    function resetTokenRoyalty(uint256 tokenId) public onlyRole(MANAGER_ROLE) {
        _resetTokenRoyalty(tokenId);
    }

    /// @notice Grants `role` to `account`. Prevents setting 0 address, reserved for Singleton
    /// @dev The caller must have the vault role for `role`, and `account` cannot be the zero address.
    /// @param role The role to be granted.
    /// @param account The address to be granted the role.
    function grantRole(
        bytes32 role,
        address account
    )
        public
        virtual
        override(AccessControl, IERC1155Singleton)
        onlyRole(getRoleAdmin(role))
    {
        require(account != address(0), "Address cannot be zero");
        _grantRole(role, account);
    }

    /// @param interfaceId The interface identifier, as specified in ERC-165
    function _registerInterface(bytes4 interfaceId) internal {
        _supportedInterfaces[interfaceId] = true;
    }

    /// @param contractURI_ the stringified JSON for the contractURI
    function setContractURI(
        string memory contractURI_
    ) public onlyRole(MANAGER_ROLE) {
        _setContractURI(contractURI_);
    }

    /// @param contractURI_ the stringified JSON for the contractURI
    function _setContractURI(string memory contractURI_) internal {
        contractURI = string(
            abi.encodePacked("data:application/json;utf8,", contractURI_)
        );
    }

    /// @notice Returns true if this contract implements the interface defined by `interfaceId`.
    /// @param interfaceId The interface
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC165, ERC1155, ERC2981, AccessControl, IERC1155Singleton)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function version() public pure virtual returns (uint256) {
        return 1;
    }
}
