import { abi as ERC1155SingletonABI } from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import { CONTRACT_URI, TOKEN_URI, LICENSE_URI } from "../test/utils";

const hre = require("hardhat");
const iface = new hre.ethers.utils.Interface(ERC1155SingletonABI);

const OWNER_ADDRESS = "0x0c4Cb3C12F771dEB4C60C841c18CDea6057CE8c0";
const DEFAULT_ROYALTY = 0;

const callData = iface.encodeFunctionData("init", [
  OWNER_ADDRESS,
  CONTRACT_URI,
  "123123123123123",
  LICENSE_URI,
  DEFAULT_ROYALTY,
]);

console.log(callData);
