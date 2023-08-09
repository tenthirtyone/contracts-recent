require("dotenv").config();
import { abi as ERC1155SingletonABI, bytecode as ERC1155Bytecode } from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import { abi as BEACONABI, bytecode as BeaconBytecode } from "../artifacts/contracts/Beacon.sol/Beacon.json";
import { abi as FactoryABI } from "../artifacts/contracts/SingletonFactory.sol/SingletonFactory.json";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

import { ethers } from "ethers";

const provider = new ethers.providers.JsonRpcProvider(
  process.env.PROVIDER_URL
);
export const CONTRACT_SALT = "Dcentral.me Token Contract";
const manager = "0x54B4D9e7D58B6F4CF2F053fACFf57fE330E91d01"
const encodedString = ethers.utils.formatBytes32String(CONTRACT_SALT);
const FACTORY_ADDRESS = "0xa96d115aa928544016e21795457A866B12D60447"
const BEACON_ADDRESS = "0x471A4b7de2FE71F44db772122320baB88bFb853C"
const PROXY_ADDRESS = "0x0746836dEF8c7cB37EB9274306D5b6F8b2528ab7"
const VAULT_ADDRESS = "0x795fa5ae8fE4E4bE23A200fF8C6AFdAb26537eFB"
const SALT = encodedString
const MNEMONIC = process.env.MNEMONIC || "";

async function main() {
  const [manager, satoshi, conan, solo, rothbard] = createWallets(MNEMONIC, 5);

  const tokenContract = new ethers.Contract(PROXY_ADDRESS, ERC1155SingletonABI, conan);

  const directSaleTx = await tokenContract.safeTransferFrom(conan.address, solo.address, 2, 1, "0x", { gasLimit: 30000000 })

  const directSaleReceipt = await directSaleTx.wait();

  //const mintTx = await tokenContract.mint(VAULT_ADDRESS, 1, "0x", { gasLimit: 100000 })
  console.log(directSaleReceipt)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


function createWallets(mnemonic: string, N: number) {
  const wallets = [];
  for (let i = 0; i < N; i++) {
    const path = `m/44'/60'/0'/0/${i}`; // Incrementing the last element of the derivation path
    let wallet = ethers.Wallet.fromMnemonic(mnemonic, path);
    wallet = wallet.connect(provider)
    wallets.push(wallet);
  }
  return wallets;
}
