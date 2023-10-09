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
export const CONTRACT_SALT = "Dcentral.me Token Contract";

const encodedString = hre.ethers.utils.formatBytes32String(CONTRACT_SALT);
const FACTORY_ADDRESS = "0x7eCcF14E9671eEA813d42cB42C5BE58f46980666";
const SINGLETON_ADDRESS = "0xafbcea3ff00da26d4d989b7eec9d8bc6ad2c4e18";
const SALT = encodedString;

async function main() {
  const [owner, manager] = await hre.ethers.getSigners();

  const factory = new hre.ethers.Contract(FACTORY_ADDRESS, FactoryABI, owner);
  const abiCoder = new hre.ethers.utils.AbiCoder();
  const encodedParameters = abiCoder.encode(
    ["address", "address"],
    [SINGLETON_ADDRESS, owner.address]
  );

  console.log(owner.address);
  const beaconInitCode = BeaconBytecode + encodedParameters.slice(2);

  // This gasLimit must be manually set. This is approximately twice the amount necessary
  // TODO set all the other gasLimits.
  const beaconTx = await factory.deploy(SALT, beaconInitCode);

  const beaconReceipt = await beaconTx.wait();

  console.log(`Beacon deployed at ${beaconReceipt.events[0].address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
