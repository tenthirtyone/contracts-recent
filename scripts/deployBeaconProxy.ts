import { abi as ERC1155SingletonABI, bytecode as ERC1155Bytecode } from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import { abi as BEACONABI, bytecode as BeaconBytecode } from "../artifacts/contracts/Beacon.sol/Beacon.json";
import { abi as FactoryABI } from "../artifacts/contracts/SingletonFactory.sol/SingletonFactory.json";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
export const CONTRACT_SALT = "Dcentral.me Token Contract";
const manager = "0x54B4D9e7D58B6F4CF2F053fACFf57fE330E91d01"
const encodedString = hre.ethers.utils.formatBytes32String(CONTRACT_SALT);
const FACTORY_ADDRESS = "0xa96d115aa928544016e21795457A866B12D60447"
const BEACON_ADDRESS = "0x790E5ABBDECcaFd353cA31df1D90F10b404a7Dd0"
const SALT = encodedString

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const beaconContract = new hre.ethers.Contract(BEACON_ADDRESS, BEACONABI, owner);
  console.log("Connected to the beacon contract at:", BEACON_ADDRESS);

  console.log(`Beacon contract owner is: ${await beaconContract.owner()}`)

  const iface = new hre.ethers.utils.Interface(ERC1155SingletonABI);
  const callData = iface.encodeFunctionData("init", [owner.address, manager]);

  const deployBeaconProxyTx = await beaconContract.deployProxyContract(
    callData
  );

  const receipt = await deployBeaconProxyTx.wait();

  console.log(receipt)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
