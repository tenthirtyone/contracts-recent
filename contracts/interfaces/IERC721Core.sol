// SPDX-License-Identifier: MIT
/*
LazyMinter:
createVoucher - maxSupply is only for ERC1155
Update Init params

*/
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
pragma solidity ^0.8.22;

interface IERC721Core is IERC721 {
    function init(
        address owner,
        string memory name,
        string memory symbol,
        string memory contractURI_
        //string memory tokenURI_,
        //string memory licenseURI_,
        //uint96 defaultRoyalty
    ) external;

    function grantRole(bytes32 role, address account) external;

    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    function version() external pure returns (uint256);
}
