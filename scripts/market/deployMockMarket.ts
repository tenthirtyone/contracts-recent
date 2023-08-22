require("dotenv").config();
import { abi as MockMarketplaceABI, bytecode as MockMarketplaceBytecode } from "../../artifacts/contracts/mocks/MockMarketplace.sol/MockMarketplace.json";

import { ethers } from "ethers";
const provider = new ethers.providers.JsonRpcProvider(
  process.env.PROVIDER_URL
);

const hre = require("hardhat");

async function main() {
  const MNEMONIC = process.env.MNEMONIC || "";
  const [manager, satoshi, conan, solo, rothbard] = createWallets(MNEMONIC, 5);

  console.log(`manager: ${manager.address}`)
  console.log(`satoshi: ${satoshi.address}`)
  console.log(`conan: ${conan.address}`)
  console.log(`solo: ${solo.address}`)
  console.log(`rothbard: ${rothbard.address}`)


  const factory = new ethers.ContractFactory(MockMarketplaceABI, MockMarketplaceBytecode, manager);
  const contract = await factory.deploy({ gasLimit: 30000000 });

  console.log(await contract)
  console.log(
    `MockMarket deployed to https://testnet-zkevm.polygonscan.com/address/${contract.address}`
  );

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function createWallets(mnemonic: string, N: number) {
  const wallets = [];
  for (let i = 0; i < N; i++) {
    const path = `m/44'/60'/0'/0/${i}`;
    let wallet = ethers.Wallet.fromMnemonic(mnemonic, path);
    wallet = wallet.connect(provider)
    wallets.push(wallet);
  }
  return wallets;
}

