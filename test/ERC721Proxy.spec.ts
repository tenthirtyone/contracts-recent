import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  abi as ERC721SingletonABI,
  bytecode as ERC721Bytecode,
} from "../artifacts/contracts/ERC721Singleton.sol/ERC721Singleton.json";
import { bytecode as BeaconBytecode } from "../artifacts/contracts/Beacon.sol/Beacon.json";
import {
  createSalt,
  createBytes32,
  MANAGER_ROLE,
  DEFAULT_OWNER_ROLE,
  INTERFACE_ID_ERC165,
  INTERFACE_ID_ERC721,
  INTERFACE_ID_ERC2981,
  INTERFACE_ID_ACCESS_CONTROL,
  ZERO_BYTES32,
  BASE_POINTS,
  ZERO_ADDRESS,
  CONTRACT_SALT,
  ROYALTY,
} from "./utils";

import { ERC721Singleton } from "../typechain";

const hre = require("hardhat");
const ethers = hre.ethers;

describe("ERC721Proxy", function () {
  const SALT = createSalt(CONTRACT_SALT);

  async function deploy() {
    const [owner, manager] = await ethers.getSigners();

    const SingletonFactory = await ethers.getContractFactory(
      "MockSingletonFactory"
    );
    const factoryInstance = await SingletonFactory.deploy();

    const erc721Address = await factoryInstance.callStatic.computeAddress(
      SALT,
      ERC721Bytecode
    );

    await factoryInstance.deploy(SALT, ERC721Bytecode, { gasLimit: 30000000 });

    const abiCoder = new ethers.utils.AbiCoder();
    const encodedParameters = abiCoder.encode(
      ["address", "address"],
      [erc721Address, owner.address]
    );
    const beaconInitCode = BeaconBytecode + encodedParameters.slice(2);

    const beaconAddress = await factoryInstance.computeAddress(
      SALT,
      beaconInitCode
    );

    await factoryInstance.deploy(SALT, beaconInitCode, { gasLimit: 30000000 });

    const beacon = await ethers.getContractAt("Beacon", beaconAddress);

    const iface = new ethers.utils.Interface(ERC721SingletonABI);
    const callData = iface.encodeFunctionData("init", [
      owner.address,
      "Test TKN",
      "TKN",
    ]);

    const proxyAddress = await beacon.callStatic.deployProxyContract(callData);

    await beacon.deployProxyContract(callData);

    const proxy = (await ethers.getContractAt(
      "ERC721Singleton",
      proxyAddress
    )) as unknown as ERC721Singleton;

    return { proxy, owner, manager };
  }

  describe("Deployment", function () {
    it("should deploy contract", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      expect(proxy).to.exist;
      expect(owner).to.exist;
    });
  });

  describe("ERC165 Interface support", function () {
    it("should support ERC165 interface", async () => {
      const { proxy } = await loadFixture(deploy);

      expect(await proxy.supportsInterface(INTERFACE_ID_ERC165)).to.equal(true);
    });
    it("should support ERC721 interface", async () => {
      const { proxy } = await loadFixture(deploy);

      expect(await proxy.supportsInterface(INTERFACE_ID_ERC721)).to.equal(true);
    });

    it("should support Access Control interface", async () => {
      const { proxy } = await loadFixture(deploy);

      expect(
        await proxy.supportsInterface(INTERFACE_ID_ACCESS_CONTROL)
      ).to.equal(true);
    });
  });

  describe("Minting", function () {
    it("should mint a token to the owner", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      await proxy.mint(owner.address);
      const balance = await proxy.balanceOf(owner.address);
      expect(balance).to.equal(1);
    });

    it("should reject a mint if not an owner", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_, _manager, satoshi] = await ethers.getSigners();
      await expect(proxy.connect(satoshi).mint(satoshi.address)).to.be.reverted;
    });
  });

  describe("Transferring", function () {
    it("should safely transfer a token from one account to another", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      await proxy.mint(owner.address);
      await proxy.transferFrom(owner.address, satoshi.address, 0);
      const balance = await proxy.balanceOf(satoshi.address);
      expect(balance).to.equal(1);
    });
  });

  describe("Access Control", function () {
    it("should set the DEFAULT_ADMIN_ROLE to the owner/vault", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager] = await ethers.getSigners();

      const hasManagerRole = await proxy.hasRole(
        DEFAULT_OWNER_ROLE,
        owner.address
      );

      expect(hasManagerRole).to.equal(true);
    });
    it("should allow an account with the DEFAULT_ADMIN_ROLE to grant the MANAGER_ROLE", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();

      await proxy.grantRole(MANAGER_ROLE, satoshi.address);
      const hasManagerRole = await proxy.hasRole(MANAGER_ROLE, satoshi.address);

      expect(hasManagerRole).to.equal(true);
    });

    it("should not allow an account without the DEFAULT_ADMIN_ROLE to grant the MANAGER_ROLE", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi, finney] = await ethers.getSigners();

      await expect(
        proxy.connect(satoshi).grantRole(MANAGER_ROLE, finney.address)
      ).to.be.reverted;
    });

    it("should allow an account with the DEFAULT_ADMIN_ROLE to revoke the MANAGER_ROLE", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      let hasManagerRole = await proxy.hasRole(MANAGER_ROLE, satoshi.address);
      expect(hasManagerRole).to.equal(false);

      await proxy.grantRole(MANAGER_ROLE, satoshi.address);
      hasManagerRole = await proxy.hasRole(MANAGER_ROLE, satoshi.address);
      expect(hasManagerRole).to.equal(true);

      await proxy.revokeRole(MANAGER_ROLE, satoshi.address);
      hasManagerRole = await proxy.hasRole(MANAGER_ROLE, satoshi.address);
      expect(hasManagerRole).to.equal(false);
    });

    it("should not allow an account without the DEFAULT_ADMIN_ROLE to revoke the MANAGER_ROLE", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();

      await proxy.grantRole(MANAGER_ROLE, satoshi.address);

      await expect(
        proxy.connect(satoshi).revokeRole(MANAGER_ROLE, satoshi.address)
      ).to.be.reverted;
    });
    it("should only allow an account with the DEFAULT_ADMIN_ROLE to grant other roles", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi, finney] = await ethers.getSigners();
      const randomRole = createBytes32("RANDOM_ROLE");
      await proxy.grantRole(randomRole, finney.address);
      await expect(proxy.connect(satoshi).grantRole(randomRole, finney.address))
        .to.be.reverted;
    });

    it("should only allow an account with the DEFAULT_ADMIN_ROLE to revoke other roles", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi, finney] = await ethers.getSigners();
      const randomRole = createBytes32("RANDOM_ROLE");
      await proxy.grantRole(randomRole, finney.address);
      await proxy.revokeRole(randomRole, finney.address);
      await expect(
        proxy.connect(satoshi).revokeRole(randomRole, finney.address)
      ).to.be.reverted;
    });
  });

  describe("Role Management", function () {
    it("allows a role to be granted to an account", async function () {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      const newRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("NEW_ROLE")
      );

      await proxy.grantRole(newRole, satoshi.address);

      expect(await proxy.hasRole(newRole, satoshi.address)).to.equal(true);
    });

    it("reverts when attempting to grant a role to the zero address", async function () {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      const newRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("NEW_ROLE")
      );

      await expect(proxy.grantRole(newRole, ZERO_ADDRESS)).to.be.revertedWith(
        "Address cannot be zero"
      );
    });

    it("reverts when a non-admin tries to grant a role", async function () {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      const newRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("NEW_ROLE")
      );

      await expect(proxy.connect(satoshi).grantRole(newRole, satoshi.address))
        .to.be.reverted;
    });
  });
});
``;