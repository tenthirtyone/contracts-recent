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

const BEACON_ADDRESS = "0xb013fA1A91ce0303458b771da6d52D0f72F4Bb36";
const ERC1155_LOGIC_CONTRACT = "0x041D87c0D6AFDdEa4f5C3afeaCfcD14F5580E94B";

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const beaconContract = new hre.ethers.Contract(
    BEACON_ADDRESS,
    BEACONABI,
    owner
  );
  console.log("Connected to the beacon contract at:", BEACON_ADDRESS);

  console.log(`Beacon contract owner is: ${await beaconContract.owner()}`);

  const deployBeaconProxyTx = await beaconContract.upgradeTo(
    ERC1155_LOGIC_CONTRACT
  );

  const receipt = await deployBeaconProxyTx.wait();

  console.log(receipt);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
