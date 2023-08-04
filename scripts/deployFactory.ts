import { abi as ERC1155SingletonABI, bytecode as ERC1155Bytecode } from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
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
const FACTORY_ADDRESS = "0xa96d115aa928544016e21795457A866B12D60447"
const SALT = encodedString


async function main() {
  const [owner, manager] = await hre.ethers.getSigners();
  const Factory = await hre.ethers.getContractFactory("SingletonFactory");
  console.log(owner.address)
  const factory = await Factory.deploy();
  await factory.deployed();

  console.log(
    `Factory deployed to https://explorer.public.zkevm-test.net/address/${factory.address}`
  );

  console.log()

  const erc1155Address = await factory.callStatic.deploy(SALT, ERC1155Bytecode);

  console.log(`Attempting to deploy 1155SingletonFactory to ${erc1155Address}`)

  const factoryTx = await factory.deploy(SALT, ERC1155Bytecode);
  console.log(`SingletonFactory deployed at ${erc1155Address}`)


  const abiCoder = new hre.ethers.utils.AbiCoder();
  const encodedParameters = abiCoder.encode(["address", "address"], [erc1155Address, owner.address]);
  const beaconInitCode = BeaconBytecode + encodedParameters.slice(2);

  // This gasLimit must be manually set. This is approximately twice the amount necessary
  const beaconTx = await factory.deploy(SALT, beaconInitCode, { gasLimit: 3185580 });

  const beaconReceipt = await beaconTx.wait();



  //console.log(`SingletonFactory deployed at ${beaconAddress}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
