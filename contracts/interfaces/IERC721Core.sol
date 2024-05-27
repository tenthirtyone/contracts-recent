// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
pragma solidity ^0.8.22;

interface IERC721Core is IERC721 {
    function init(
        address owner,
        string memory name,
        string memory symbol
    ) external;

    function grantRole(bytes32 role, address account) external;

    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    function version() external pure returns (uint256);
}