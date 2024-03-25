require("dotenv").config();
import { ethers } from "ethers";

const wallet = ethers.Wallet.fromMnemonic(
  "diesel east flat guess wrist example dial news market decide hip fortune"
);

console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
