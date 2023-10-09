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
export const CONTRACT_URI =
  "https://dcentral.me/api/contracts/${chain}/${address}";
export const TOKEN_URI =
  "https://dcentral.me/api/contracts/${chain}/${address}/${tokenId}";
export const LICENSE_URI = "https://dcentral.me";
