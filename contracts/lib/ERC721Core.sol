// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

import "../interfaces/IERC721Core.sol";

/// @title ERC721Core
/// @dev A contract implementing ERC721 with an additional initialization logic and administration functions.
contract ERC721Core is
    ERC165,
    IERC721Core,
    ERC721,
    EIP712,
    ERC2981,
    AccessControl
{
    uint256 public currentTokenId = 0;
    string private _name;
    string private _symbol;

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
    constructor() ERC721("", "") EIP712("DcentralSFT-Voucher", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, address(0));

        // Singleton
        didInit = true;
    }

    /// @notice Initializes the contract. Can only be done once.
    /// @param name The token name
    /// @param symbol The token symbol.
    function init(
        address owner,
        string memory name,
        string memory symbol
    ) public {
        require(!didInit, "Contract has already been initialized");
        didInit = true;
        _name = name;
        _symbol = symbol;
        _grantRole(DEFAULT_ADMIN_ROLE, owner);
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
        override(AccessControl, IERC721Core)
        onlyRole(getRoleAdmin(role))
    {
        require(account != address(0), "Address cannot be zero");
        _grantRole(role, account);
    }

    /// @param interfaceId The interface identifier, as specified in ERC-165
    function _registerInterface(bytes4 interfaceId) internal {
        _supportedInterfaces[interfaceId] = true;
    }

    /// @notice Returns true if this contract implements the interface defined by `interfaceId`.
    /// @param interfaceId The interface
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC165, ERC721, ERC2981, AccessControl, IERC721Core)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function version() public pure virtual returns (uint256) {
        return 1;
    }
}
