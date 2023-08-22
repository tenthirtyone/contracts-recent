require("dotenv").config();
import { abi as ERC1155SingletonABI, bytecode as ERC1155Bytecode } from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
export const CONTRACT_SALT = "Dcentral.me Token Contract";
export function createSalt(string: string) {
  return hre.ethers.utils.formatBytes32String(string);
}
const FACTORY_ADDRESS = "0xa96d115aa928544016e21795457A866B12D60447"
const SALT = createSalt(CONTRACT_SALT);

async function main() {
  const factory = await hre.ethers.getContractAt("SingletonFactory", FACTORY_ADDRESS);

  console.log(
    `Using factory at https://explorer.public.zkevm-test.net/address/${factory.address}`
  );

  const tx = await factory.deploy(SALT, ERC1155Bytecode, { gasLimit: 30000000 });

  const receipt = await tx.wait();

  console.log(receipt)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
