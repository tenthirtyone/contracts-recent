import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  abi as ERC1155SingletonABI,
  bytecode as ERC1155Bytecode,
} from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import {
  abi as ERC721SingletonABI,
  bytecode as ERC721Bytecode,
} from "../artifacts/contracts/ERC721Singleton.sol/ERC721Singleton.json";
import { bytecode as BeaconBytecode } from "../artifacts/contracts/Beacon.sol/Beacon.json";

import { ERC1155Singleton, ERC721Singleton } from "../typechain";

import {
  createSalt,
  CONTRACT_URI,
  TOKEN_URI,
  LICENSE_URI,
  ROYALTY,
} from "./utils";

const hre = require("hardhat");
const ethers = hre.ethers;

describe("Gas Usage", function () {
  const SALT = createSalt("Dcentral.me Token Contract");

  async function deploy() {
    const [owner, manager] = await ethers.getSigners();

    const SingletonFactory = await ethers.getContractFactory(
      "MockSingletonFactory"
    );
    await SingletonFactory.deploy({ gasLimit: 30000000 });
    const factoryInstance = await SingletonFactory.deploy({
      gasLimit: 30000000,
    });
    const block = await ethers.provider.getBlock(1);

    if (block) {
      console.log(`Gas used for SingletonFactory: ${block.gasUsed.toString()}`);
    }

    const erc1155Address = await factoryInstance.callStatic.computeAddress(
      SALT,
      ERC1155Bytecode
    );

    const tx = await factoryInstance.deploy(SALT, ERC1155Bytecode, {
      gasLimit: 30000000,
    });
    const erc1155SingletonReceipt = await tx.wait();

    if (erc1155SingletonReceipt) {
      console.log(
        `Gas used for ERC1155Singleton: ${erc1155SingletonReceipt.gasUsed.toString()}`
      );
    }

    const abiCoder = new ethers.utils.AbiCoder();
    const encodedParameters = abiCoder.encode(
      ["address", "address"],
      [erc1155Address, owner.address]
    );
    const beaconInitCode = BeaconBytecode + encodedParameters.slice(2);

    const beaconAddress = await factoryInstance.computeAddress(
      SALT,
      beaconInitCode
    );

    const beaconTx = await factoryInstance.deploy(SALT, beaconInitCode, {
      gasLimit: 30000000,
    });
    const beaconReceipt = await beaconTx.wait();

    if (beaconReceipt) {
      console.log(`Gas used for Beacon: ${beaconReceipt.gasUsed.toString()}`);
    }

    const beacon = await ethers.getContractAt("Beacon", beaconAddress);

    const iface = new ethers.utils.Interface(ERC1155SingletonABI);
    const callData = iface.encodeFunctionData("init", [
      owner.address,
      CONTRACT_URI,
      TOKEN_URI,
      LICENSE_URI,
      ROYALTY,
    ]);

    const proxyAddress = await beacon.callStatic.deployProxyContract(callData);

    const proxyTx = await beacon.deployProxyContract(callData);

    const proxyReceipt = await proxyTx.wait();

    if (proxyReceipt) {
      console.log(`Gas used for Proxy: ${proxyReceipt.gasUsed.toString()}`);
    }

    const proxy = (await ethers.getContractAt(
      "ERC1155Singleton",
      proxyAddress
    )) as unknown as ERC1155Singleton;

    const mintTx = await proxy.mint(
      owner.address,
      1,
      ethers.utils.formatBytes32String("")
    );
    const mintReceipt = await mintTx.wait();
    if (mintReceipt) {
      console.log(`Gas used for mint: ${mintReceipt.gasUsed.toString()}`);
    }

    // current optimized record
    /*
      Gas used for SingletonFactory: 175543
      Gas used for ERC1155Singleton: 2455401
      Gas used for Beacon: 990519
      Gas used for Proxy: 736320
      Gas used for mint: 83648
      1225 tokens batched
    */
    const batchTokenCount = 500;
    const amounts = new Array(batchTokenCount).fill(1e3);

    const batchMint = await proxy.mintBatch(owner.address, amounts, "0x", {
      gasLimit: 30000000,
    });
    const batchReceipt = await batchMint.wait();

    console.log(
      `Maximum batchMint: ${batchTokenCount} tokens for total gas: ${batchReceipt.gasUsed}`
    );

    const xferTx = await proxy.safeTransferFrom(
      owner.address,
      manager.address,
      0,
      1,
      "0x00"
    );
    const xferReceipt = await xferTx.wait();

    console.log(
      `Gas used to transfer a token: ${xferReceipt.gasUsed.toString()}`
    );

    console.log("");
    console.log("");

    console.log("");
    console.log("");
    console.log("");

    const erc721Address = await factoryInstance.callStatic.computeAddress(
      SALT,
      ERC721Bytecode
    );
    const tx721 = await factoryInstance.deploy(SALT, ERC721Bytecode, {
      gasLimit: 30000000,
    });
    const erc721SingletonReceipt = await tx721.wait();

    if (erc721SingletonReceipt) {
      console.log(
        `Gas used for ERC721Singleton: ${erc721SingletonReceipt.gasUsed.toString()}`
      );
    }

    const abiCoder721 = new ethers.utils.AbiCoder();
    const encodedParameters721 = abiCoder721.encode(
      ["address", "address"],
      [erc721Address, owner.address]
    );
    const beaconInitCode721 = BeaconBytecode + encodedParameters721.slice(2);

    const beaconAddress721 = await factoryInstance.computeAddress(
      SALT,
      beaconInitCode721
    );

    const beaconTx721 = await factoryInstance.deploy(SALT, beaconInitCode721, {
      gasLimit: 30000000,
    });

    const beaconReceipt721 = await beaconTx721.wait();

    if (beaconReceipt721) {
      console.log(
        `Gas used for Beacon: ${beaconReceipt721.gasUsed.toString()}`
      );
    }

    const beacon721 = await ethers.getContractAt("Beacon", beaconAddress721);

    const iface721 = new ethers.utils.Interface(ERC721SingletonABI);
    const callData721 = iface721.encodeFunctionData("init", [
      owner.address,
      "Token",
      "SYM",
      CONTRACT_URI,
    ]);

    const proxyAddress721 = await beacon721.callStatic.deployProxyContract(
      callData721
    );

    const proxyTx721 = await beacon721.deployProxyContract(callData721);

    const proxyReceipt721 = await proxyTx721.wait();

    if (proxyReceipt721) {
      console.log(`Gas used for Proxy: ${proxyReceipt721.gasUsed.toString()}`);
    }

    const proxy721 = (await ethers.getContractAt(
      "ERC721Singleton",
      proxyAddress721
    )) as unknown as ERC721Singleton;

    const mintTx721 = await proxy721.mint(owner.address);
    const mintReceipt721 = await mintTx721.wait();
    if (mintReceipt721) {
      console.log(`Gas used for mint: ${mintReceipt721.gasUsed.toString()}`);
    }

    const xfer721 = await proxy721.transferFrom(
      owner.address,
      manager.address,
      0
    );

    const xfer721Receipt = await xfer721.wait();

    console.log(
      `Gas used for 721 transfer: ${xfer721Receipt.gasUsed.toString()}`
    );
    return { proxy, owner };

    return { proxy, owner };
  }

  describe("Deployment", function () {
    it("should report on gas usage", async () => {
      await loadFixture(deploy);
    });
  });
});
