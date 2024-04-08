require("dotenv").config();
import { ethers } from "ethers";

const wallet = ethers.Wallet.fromMnemonic(
  process.env.DEPLOYMENT_KEY_MNEMONIC as string
);

console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
