require("dotenv").config();
import {
  abi as FactoryABI,
  bytecode as FactoryBytecode,
} from "../artifacts/contracts/SingletonFactory.sol/SingletonFactory.json";
import {
  abi as ERC721SingletonABI,
  bytecode as ERC721Bytecode,
} from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
export const CONTRACT_SALT = "Dcentral.me";
export function createSalt(string: string) {
  return hre.ethers.utils.formatBytes32String(string);
}
const FACTORY_ADDRESS = "0x7eCcF14E9671eEA813d42cB42C5BE58f46980666";
const SALT = createSalt(CONTRACT_SALT);

async function main() {
  const [owner, manager] = await hre.ethers.getSigners();
  console.log(owner.address);

  const factory = new hre.ethers.Contract(FACTORY_ADDRESS, FactoryABI, owner);

  console.log(`Using factory at ${factory.address}`);

  const tx = await factory.deploy(SALT, ERC721Bytecode);

  console.log(tx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
