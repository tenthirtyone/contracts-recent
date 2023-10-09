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
export const CONTRACT_SALT = "Dcentral.me Token Contract2";

const encodedString = hre.ethers.utils.formatBytes32String(CONTRACT_SALT);
const FACTORY_ADDRESS = "0xEE3E1FA30F366162B9bec935B9e59DeE4A91979B";
const SALT = encodedString;

async function main() {
  const [owner, manager] = await hre.ethers.getSigners();
  const factory = new hre.ethers.Contract(FACTORY_ADDRESS, FactoryABI, owner);

  const erc1155Address = await factory.callStatic.deploy(SALT, ERC1155Bytecode);

  console.log(`Attempting to deploy 1155SingletonFactory to ${erc1155Address}`);

  const factoryTx = await factory.deploy(SALT, ERC1155Bytecode, {
    gasPrice: 6000000000,
    gasLimit: 1_000_000,
  });
  const receipt = await factoryTx.wait();
  console.log(receipt);
  return;
  console.log(`Singleton deployed at ${erc1155Address}`);
  //const factoryTx = await factory.deploy(SALT, ERC1155Bytecode);
  await factoryTx.wait();
  const abiCoder = new hre.ethers.utils.AbiCoder();
  const encodedParameters = abiCoder.encode(
    ["address", "address"],
    [erc1155Address, owner.address]
  );

  console.log(owner.address);
  const beaconInitCode = BeaconBytecode + encodedParameters.slice(2);

  // This gasLimit must be manually set. This is approximately twice the amount necessary
  // TODO set all the other gasLimits.
  const beaconTx = await factory.deploy(SALT, beaconInitCode, {
    gasLimit: 8000000,
  });

  const beaconReceipt = await beaconTx.wait();

  console.log(`Beacon deployed at ${beaconReceipt.events[0].address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
