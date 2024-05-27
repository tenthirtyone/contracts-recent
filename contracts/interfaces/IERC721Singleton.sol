// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
pragma solidity ^0.8.22;

interface IERC721Singleton is IERC721 {
    function mint(address to) external;
}
