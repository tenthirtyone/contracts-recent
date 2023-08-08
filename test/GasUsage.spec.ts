import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { abi as ERC1155SingletonABI, bytecode as ERC1155Bytecode } from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import { bytecode as BeaconBytecode } from "../artifacts/contracts/Beacon.sol/Beacon.json";

import { ERC1155Singleton } from "../typechain"

const hre = require("hardhat");
const ethers = hre.ethers;

function createSalt(string: string) {
  return ethers.utils.formatBytes32String(string);
}

describe("Gas Usage", function () {
  const SALT = createSalt("Dcentral.me Token Contract");

  async function deploy() {
    const [owner, manager] = await ethers.getSigners();

    const SingletonFactory = await ethers.getContractFactory(
      "MockSingletonFactory"
    );
    await SingletonFactory.deploy({ gasLimit: 30000000 });
    const factoryInstance = await SingletonFactory.deploy({ gasLimit: 30000000 });
    const block = await ethers.provider.getBlock(1);

    if (block) {
      console.log(`Gas used for SingletonFactory: ${block.gasUsed.toString()}`);
    }

    const erc1155Address = await factoryInstance.callStatic.computeAddress(
      SALT,
      ERC1155Bytecode
    );

    const tx = await factoryInstance.deploy(SALT, ERC1155Bytecode, { gasLimit: 30000000 });
    const erc1155SingletonReceipt = await tx.wait();

    if (erc1155SingletonReceipt) {
      console.log(
        `Gas used for ERC1155Singleton: ${erc1155SingletonReceipt.gasUsed.toString()}`
      );
    }

    const abiCoder = new ethers.utils.AbiCoder();
    const encodedParameters = abiCoder.encode(["address", "address"], [erc1155Address, owner.address]);
    const beaconInitCode = BeaconBytecode + encodedParameters.slice(2);

    const beaconAddress = await factoryInstance.computeAddress(
      SALT,
      beaconInitCode
    );

    const beaconTx = await factoryInstance.deploy(SALT, beaconInitCode, { gasLimit: 30000000 });
    const beaconReceipt = await beaconTx.wait();

    if (beaconReceipt) {
      console.log(
        `Gas used for Beacon: ${beaconReceipt.gasUsed.toString()}`
      );
    }

    const beacon = await ethers.getContractAt(
      "Beacon",
      beaconAddress
    );

    const iface = new ethers.utils.Interface(ERC1155SingletonABI);
    const callData = iface.encodeFunctionData("init", [owner.address, manager.address]);

    const proxyAddress = await beacon.callStatic.deployProxyContract(
      callData
    );

    const proxyTx = await beacon.deployProxyContract(
      callData
    );

    const proxyReceipt = await proxyTx.wait();

    if (proxyReceipt) {
      console.log(
        `Gas used for Proxy: ${proxyReceipt.gasUsed.toString()}`
      );
    }

    const proxy = await ethers.getContractAt("ERC1155Singleton", proxyAddress) as unknown as ERC1155Singleton;

    const mintTx = await proxy.mint(
      owner.address,
      1,
      ethers.utils.formatBytes32String("")
    );
    const mintReceipt = await mintTx.wait();
    if (mintReceipt) {
      console.log(`Gas used for mint: ${mintReceipt.gasUsed.toString()}`);
    }

    return { proxy, owner };
  }

  describe("Deployment", function () {
    it("should report on gas usage", async () => {
      await loadFixture(deploy);
    });
  });
});
