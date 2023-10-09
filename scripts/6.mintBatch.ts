require("dotenv").config();
import {
  abi as ERC1155SingletonABI,
  bytecode as ERC1155Bytecode,
} from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import {
  abi as BEACONABI,
  bytecode as BeaconBytecode,
} from "../artifacts/contracts/Beacon.sol/Beacon.json";
import { abi as FactoryABI } from "../artifacts/contracts/SingletonFactory.sol/SingletonFactory.json";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

const hre = require("hardhat");

const TOKEN_ADDRESS = "0x1eBB7eC9988632B56c1dBB65DB247d9D4A577F6A";

const MNEMONIC = process.env.MNEMONIC || "";
const LICENSE_URI = "https://dcentral.me/license";
async function main() {
  const [owner] = await hre.ethers.getSigners();

  const tokenContract = new hre.ethers.Contract(
    TOKEN_ADDRESS,
    ERC1155SingletonABI,
    owner
  );

  const batchTokenCount = 550;
  const amounts = new Array(batchTokenCount).fill(1e3);
  const licenses = new Array(batchTokenCount).fill(LICENSE_URI);

  const mintTx = await tokenContract.mintBatch(
    owner.address,
    amounts,
    licenses,
    "0x",
    {
      gasLimit: 30000000,
    }
  );
  console.log(mintTx);
  const receipt = await mintTx.wait();

  console.log(mintTx);
  console.log(receipt);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
