require("dotenv").config();
import {
  abi as ERC1155SingletonABI,
  bytecode as ERC1155Bytecode,
} from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import { bytecode as BeaconBytecode } from "../artifacts/contracts/Beacon.sol/Beacon.json";
import { abi as FactoryABI } from "../artifacts/contracts/SingletonFactory.sol/SingletonFactory.json";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [owner, manager] = await hre.ethers.getSigners();
  const Factory = await hre.ethers.getContractFactory("SingletonFactory");
  console.log(`The deployer wallet address is: ${owner.address}`);

  const factory = await Factory.deploy({ gasLimit: 300_000 });
  await factory.deployed();

  console.log(`Factory deployed to ${factory.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
