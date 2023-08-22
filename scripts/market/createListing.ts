require("dotenv").config();
import { abi as ERC1155SingletonABI, bytecode as ERC1155Bytecode } from "../../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import { abi as MarketABI, bytecode as MarketBytecode } from "../../artifacts/contracts/mocks/MockMarketplace.sol/MockMarketplace.json";

import { ethers } from "ethers";

const provider = new ethers.providers.JsonRpcProvider(
  process.env.PROVIDER_URL
);
const PROXY_ADDRESS = "0x5a4a4BcC4292a7a8Ea1b1fC267AA479B90aF803f";
const MARKET_ADDRESS = "0x8F4cd55d01B377f4F848Da8E62923D98bA93f00e";
const MNEMONIC = process.env.MNEMONIC || "";

async function main() {
  const [manager, satoshi, conan, solo, rothbard] = createWallets(MNEMONIC, 5);

  console.log(`manager: ${manager.address}`)
  console.log(`satoshi: ${satoshi.address}`)
  console.log(`conan: ${conan.address}`)
  console.log(`solo: ${solo.address}`)
  console.log(`rothbard: ${rothbard.address}`)

  // change who connects
  const satoshiTokenContract = new ethers.Contract(PROXY_ADDRESS, ERC1155SingletonABI, satoshi);
  const satoshiMarketContract = new ethers.Contract(MARKET_ADDRESS, MarketABI, satoshi);

  const conanTokenContract = new ethers.Contract(PROXY_ADDRESS, ERC1155SingletonABI, conan);
  const conanMarketContract = new ethers.Contract(MARKET_ADDRESS, MarketABI, conan);

  await satoshiTokenContract.setApprovalForAll(MARKET_ADDRESS, true, { gasLimit: 30000000 })

  const nextListing = await satoshiMarketContract.nextListingId()


  await satoshiMarketContract.createListing(PROXY_ADDRESS, 10, 1, ethers.utils.parseEther("0.0009"), { gasLimit: 30000000 });

  // remember to increment the listing each time
  const buyTx = await conanMarketContract.buyListing(nextListing, { value: ethers.utils.parseEther("0.0009"), gasLimit: 30000000 });
  await buyTx.wait();



  // Check that the token was transferred to Conan
  const balance = await conanTokenContract.balanceOf(conan.address, 9);

  console.log(balance.toString)
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
