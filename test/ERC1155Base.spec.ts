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
  ZERO_BYTES32,
  CONTRACT_URI,
  TOKEN_URI,
  LICENSE_URI,
} from "./utils";
import { ERC1155Singleton } from "../typechain";

const hre = require("hardhat");
const ethers = hre.ethers;

describe("ERC1155Singleton Singleton", function () {
  async function deploy() {
    const [owner] = await ethers.getSigners();

    const ContractFactory = await ethers.getContractFactory("ERC1155Singleton");
    const contract = (await ContractFactory.deploy({
      gasLimit: 30000000,
    })) as unknown as ERC1155Singleton;

    return { contract, owner };
  }

  describe("Deployment", function () {
    it("sets the DEFAULT_OWNER_ROLE to the 0 address", async function () {
      const { contract } = await loadFixture(deploy);

      const isSingleton = await contract.hasRole(
        DEFAULT_OWNER_ROLE,
        ZERO_ADDRESS
      );

      expect(isSingleton).to.equal(true);
    });
  });
  describe("Initialization", function () {
    it("reverts when attempting to initialize again", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(
        contract.init(owner.address, CONTRACT_URI, TOKEN_URI, LICENSE_URI)
      ).to.be.revertedWith("Contract has already been initialized");
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

      await expect(
        contract.connect(satoshi).mintBatch(owner.address, [1, 1], "0x")
      ).to.be.reverted;
    });
  });

  describe("ERC165 Interface support", function () {
    it("should support ERC165 interface", async () => {
      const { contract, owner } = await loadFixture(deploy);

      expect(await contract.supportsInterface(INTERFACE_ID_ERC165)).to.equal(
        true
      );
    });
    it("should support ERC1155 interface", async () => {
      const { contract } = await loadFixture(deploy);

      expect(await contract.supportsInterface(INTERFACE_ID_ERC1155)).to.equal(
        true
      );
    });

    it("should support Access Control interface", async () => {
      const { contract } = await loadFixture(deploy);

      expect(
        await contract.supportsInterface(INTERFACE_ID_ACCESS_CONTROL)
      ).to.equal(true);
    });
  });

  describe("Role Management", function () {
    it("allows a role to be granted to an account", async function () {
      const { contract, owner } = await loadFixture(deploy);
      const newRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("NEW_ROLE")
      );

      await expect(contract.grantRole(newRole, owner.address)).to.be.reverted;
    });

    it("reverts when attempting to grant a role eto the zero address", async function () {
      const { contract, owner } = await loadFixture(deploy);
      const newRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("NEW_ROLE")
      );

      await expect(contract.grantRole(newRole, ZERO_ADDRESS)).to.be.reverted;
    });

    it("reverts when a non-admin tries to grant a role", async function () {
      const { contract, owner } = await loadFixture(deploy);
      const newRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("NEW_ROLE")
      );

      await expect(contract.connect(owner).grantRole(newRole, owner.address)).to
        .be.reverted;
    });
  });
});
