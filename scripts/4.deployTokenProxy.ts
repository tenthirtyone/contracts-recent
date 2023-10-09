require("dotenv").config();
import {
  abi as ERC1155SingletonABI,
  bytecode as ERC1155Bytecode,
} from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import {
  abi as BEACONABI,
  bytecode as BeaconBytecode,
} from "../artifacts/contracts/Beacon.sol/Beacon.json";

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const BEACON_ADDRESS = "0xDd1Edc0AFB12b06A7D41530EA69AAe6a819EAa95";
const CONTRACT_URI = "https://dcentral.me/contracturi";
const TOKEN_URI = "https://dcentral.me/tokenuri";
const DEFAULT_ROYALTY = 1000; // 10% for the big guy

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const beaconContract = new hre.ethers.Contract(
    BEACON_ADDRESS,
    BEACONABI,
    owner
  );
  console.log("Connected to the beacon contract at:", BEACON_ADDRESS);

  console.log(`Beacon contract owner is: ${await beaconContract.owner()}`);

  const iface = new hre.ethers.utils.Interface(ERC1155SingletonABI);
  const callData = iface.encodeFunctionData("init", [
    owner.address,
    CONTRACT_URI,
    TOKEN_URI,
    DEFAULT_ROYALTY,
  ]);

  const deployBeaconProxyTx = await beaconContract.deployProxyContract(
    callData
  );

  const receipt = await deployBeaconProxyTx.wait();
  const proxyAddress = receipt.logs[0].address;

  console.log(`Proxy deployed to ${proxyAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
