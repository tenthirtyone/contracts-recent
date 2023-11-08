const hre = require("hardhat");
const ethers = hre.ethers;

export function createBytes32(string: string) {
  return ethers.utils.formatBytes32String(string);
}

export function createSalt(string: string) {
  return ethers.utils.formatBytes32String(string);
}

export function keccak256(data: Uint8Array) {
  return ethers.utils.keccak256(data);
}

export function toUtf8Bytes(data: any): Uint8Array {
  return ethers.utils.toUtf8Bytes(data);
}

export const INTERFACE_ID_ERC165 = "0x01ffc9a7";
export const INTERFACE_ID_ERC1155 = "0xd9b67a26";
export const INTERFACE_ID_ERC2981 = "0x2a55205a";
export const INTERFACE_ID_ACCESS_CONTROL = "0x01ffc9a7";
export const BASE_POINTS = 10000;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
export const DEFAULT_OWNER_ROLE = ZERO_BYTES32;
export const MANAGER_ROLE = keccak256(toUtf8Bytes("MANAGER_ROLE"));
export const CONTRACT_SALT = "Dcentral.me Token Contract";
export const ROYALTY = 5000;
export const CONTRACT_URI_MIMETYPE = "data:application/json;utf8,";
export const CONTRACT_URI = JSON.stringify({
  name: "Dcentral Tokens",
  description:
    "Dcentral Tokens are adorable aquatic beings primarily for demonstrating what can be done using the Dcentral platform. Adopt one today to try out all the Dcentral buying, selling, and bidding feature set.",
  image: "external-link-url/image.png",
  external_link: "external-link-url",
  salt: "User-level Salt",
});
export const TOKEN_URI = "https://dcentral.me/nft/ethereum/";
export const LICENSE_URI = "https://dcentral.me";
export const SEAPORT_1_5_ADDRESS = "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC";
