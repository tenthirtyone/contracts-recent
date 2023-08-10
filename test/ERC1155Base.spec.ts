import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  DEFAULT_OWNER_ROLE,
  INTERFACE_ID_ERC165,
  INTERFACE_ID_ERC1155,
  INTERFACE_ID_ERC2981,
  INTERFACE_ID_ACCESS_CONTROL,
  ZERO_ADDRESS,
  ROYALTY,
  ZERO_BYTES32
} from "./utils";
import { ERC1155Singleton } from "../typechain"

const hre = require("hardhat");
const ethers = hre.ethers;

describe("ERC1155Singleton Singleton", function () {

  async function deploy() {
    const [owner] = await ethers.getSigners();

    const ContractFactory = await ethers.getContractFactory("ERC1155Singleton");
    const contract = await ContractFactory.deploy({ gasLimit: 30000000 }) as unknown as ERC1155Singleton;

    return { contract, owner };
  }

  describe("Deployment", function () {
    it("sets the DEFAULT_OWNER_ROLE to the 0 address", async function () {
      const { contract } = await loadFixture(deploy);

      const isSingleton = await contract.hasRole(DEFAULT_OWNER_ROLE, ZERO_ADDRESS);

      expect(isSingleton).to.equal(true);
    });
  });
  describe("Initialization", function () {
    it("reverts when attempting to initialize again", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.init(owner.address, owner.address)).to.be.revertedWith("Contract has already been initialized");
    });
  });
  describe("Minting", function () {
    it("reverts when attempting to mint a new token", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.mint(owner.address, 100, "0x")).to.be.reverted;
    });
    it("reverts when attempting to batch mint tokens without the manager role", async function () {
      const { contract, owner } = await loadFixture(deploy);
      const [_owner, manager, satoshi] = await ethers.getSigners();

      await expect(contract.connect(satoshi).mintBatch(owner.address, [1, 1], "0x")).to.be.reverted;
    });
  });

  describe("Burning", function () {
    it("reverts when attempting to burn a token", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.burn(owner.address, 1, 50)).to.be.reverted;
    });
    // This is kind of a silly test since tokens cannot mint.
    it("reverts when attempting to batch burn tokens without the manager role", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.connect(owner).burnBatch(owner.address, [1, 2], [1, 1])).to.be.reverted;
    });
  });

  describe("Transferring", function () {
    it("reverts when attempting to safely transfer a token from one account to another", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.managerSafeTransferFrom(owner.address, owner.address, 1, 50, "0x")).to.be.reverted;
    });
    it("reverts when attempting to safely batch transfer tokens from one account to another without the manager role", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.connect(owner).managerSafeBatchTransferFrom(owner.address, owner.address, [1, 2], [1, 1], "0x")).to.be.reverted;
    });
  });

  describe("Royalties", function () {
    it("reverts when attempting to set default royalty without the manager role", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.connect(owner).setDefaultRoyalty(owner.address, ROYALTY)).to.be.reverted;
    });
    it("reverts when attempting to delete default royalty without the manager role", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.connect(owner).deleteDefaultRoyalty()).to.be.reverted;
    });
    it("reverts when attempting to set token royalty without the manager role", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.connect(owner).setTokenRoyalty(1, owner.address, ROYALTY)).to.be.reverted;
    });
    it("reverts when attempting to reset token royalty without the manager role", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.connect(owner).resetTokenRoyalty(1)).to.be.reverted;
    });
  });

  describe("Transfers", function () {
    it("reverts when attempting to safely batch transfer tokens from one account to another without the manager role", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(contract.connect(owner).managerSafeBatchTransferFrom(owner.address, owner.address, [1], [50], "0x")).to.be.reverted;
    });
  });

  describe("ERC165 Interface support", function () {
    it("should support ERC165 interface", async () => {
      const { contract, owner } = await loadFixture(deploy);

      expect(await contract.supportsInterface(INTERFACE_ID_ERC165)).to.equal(true);
    });
    it("should support ERC1155 interface", async () => {
      const { contract } = await loadFixture(deploy);

      expect(await contract.supportsInterface(INTERFACE_ID_ERC1155)).to.equal(true);
    });
    it("should support ERC2981 interface", async () => {
      const { contract } = await loadFixture(deploy);

      expect(await contract.supportsInterface(INTERFACE_ID_ERC2981)).to.equal(true);
    });
    it("should support Access Control interface", async () => {
      const { contract } = await loadFixture(deploy);

      expect(await contract.supportsInterface(INTERFACE_ID_ACCESS_CONTROL)).to.equal(true);
    });
  });

  describe("Role Management", function () {
    it("allows a role to be granted to an account", async function () {
      const { contract, owner } = await loadFixture(deploy);
      const newRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('NEW_ROLE'));

      await expect(contract.grantRole(newRole, owner.address)).to.be.reverted;
    });

    it("reverts when attempting to grant a role to the zero address", async function () {
      const { contract, owner } = await loadFixture(deploy);
      const newRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('NEW_ROLE'));

      await expect(contract.grantRole(newRole, ZERO_ADDRESS)).to.be.reverted;
    });

    it("reverts when a non-admin tries to grant a role", async function () {
      const { contract, owner } = await loadFixture(deploy);
      const newRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('NEW_ROLE'));


      await expect(contract.connect(owner).grantRole(newRole, owner.address)).to.be.reverted;
    });
  });

});
