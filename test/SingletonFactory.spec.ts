// @ts-nocheck
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { bytecode } from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import { createSalt } from "./utils";

const hre = require("hardhat");
const ethers = hre.ethers;

describe("SingletonFactory", function () {
  let contract;
  const SALT = createSalt("Dcentral.me Token Contract");

  async function deploy() {
    const [owner] = await ethers.getSigners();

    const ContractFactory = await ethers.getContractFactory("MockSingletonFactory");
    const contract = await ContractFactory.deploy({ gasLimit: 30000000 });

    return { contract, owner };
  }

  beforeEach(async () => {
    const { contract: contractFixture } = await loadFixture(deploy);
    contract = contractFixture;
  });

  describe("Deployment", function () {
    it("should predict the target address", async () => {
      await contract.computeAddress(SALT, bytecode);
    });
    it("should deploy bytecode", async () => {
      await contract.deploy(SALT, bytecode, { gasLimit: 30000000 });
    });
    it("predicted deployment address should match the deployment address", async () => {
      const predictedAddress = await contract.callStatic.computeAddress(
        SALT,
        bytecode
      );
      let deployedBytecode = await ethers.provider.getCode(predictedAddress);

      expect(deployedBytecode).to.equal("0x");

      await contract.deploy(SALT, bytecode, { gasLimit: 30000000 });

      deployedBytecode = await ethers.provider.getCode(predictedAddress);

      expect(deployedBytecode.length > 2).to.equal(true);
    });
    it("should revert when trying to deploy with same salt", async () => {
      await contract.deploy(SALT, bytecode, { gasLimit: 30000000 });
      try {
        await contract.deploy(SALT, bytecode, { gasLimit: 30000000 });
      } catch (e) {
        return;
      }
      throw new Error("Transaction did not revert duplicate salt.");
    });
    it("should emit ContractDeployed event when a contract is deployed", async () => {
      await expect(await contract.deploy(SALT, bytecode, { gasLimit: 30000000 }))
        .to.emit(contract, "ContractDeployed")
        .withArgs(await contract.computeAddress(SALT, bytecode));
    });
    it("should fail to deploy with empty bytecode", async () => {
      await expect(contract.deploy(SALT, "0x", { gasLimit: 30000000 })).to.be.reverted;
    });
    it("should compute different address with different salt", async () => {
      const differentSalt = createSalt("Different salt");
      const address1 = await contract.computeAddress(SALT, bytecode);
      const address2 = await contract.computeAddress(differentSalt, bytecode);
      expect(address1).to.not.equal(address2);
    });
    it("should compute different address with different bytecode", async () => {
      const differentBytecode = "0x60606040";
      const address1 = await contract.computeAddress(SALT, bytecode);
      const address2 = await contract.computeAddress(SALT, differentBytecode);
      expect(address1).to.not.equal(address2);
    });
  });
});
