
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { abi as ERC1155SingletonABI, bytecode as ERC1155Bytecode } from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import { bytecode as BeaconBytecode } from "../artifacts/contracts/Beacon.sol/Beacon.json";
import {
  createSalt,
  createBytes32,
  MANAGER_ROLE,
  DEFAULT_OWNER_ROLE,
  INTERFACE_ID_ERC165,
  INTERFACE_ID_ERC1155,
  INTERFACE_ID_ERC2981,
  INTERFACE_ID_ACCESS_CONTROL,
  ZERO_BYTES32,
  BASE_POINTS,
  ZERO_ADDRESS,
  CONTRACT_SALT,
  ROYALTY
} from "./utils";

import { ERC1155Singleton } from "../typechain"

const hre = require("hardhat");
const ethers = hre.ethers;


describe("ERC1155Proxy", function () {
  const SALT = createSalt(CONTRACT_SALT);

  async function deploy() {
    const [owner, manager] = await ethers.getSigners();

    const SingletonFactory = await ethers.getContractFactory(
      "MockSingletonFactory"
    );

    const factoryInstance = await SingletonFactory.deploy();

    const erc1155Address = await factoryInstance.callStatic.computeAddress(
      SALT,
      ERC1155Bytecode
    );

    await factoryInstance.deploy(SALT, ERC1155Bytecode, { gasLimit: 30000000 });

    const abiCoder = new ethers.utils.AbiCoder();
    const encodedParameters = abiCoder.encode(["address", "address"], [erc1155Address, owner.address]);
    const beaconInitCode = BeaconBytecode + encodedParameters.slice(2);

    const beaconAddress = await factoryInstance.computeAddress(
      SALT,
      beaconInitCode
    );

    await factoryInstance.deploy(SALT, beaconInitCode, { gasLimit: 30000000 });

    const beacon = await ethers.getContractAt(
      "Beacon",
      beaconAddress
    );

    const iface = new ethers.utils.Interface(ERC1155SingletonABI);
    const callData = iface.encodeFunctionData("init", [owner.address, manager.address]);

    const proxyAddress = await beacon.callStatic.deployProxyContract(
      callData
    );

    await beacon.deployProxyContract(
      callData
    );

    const proxy = await ethers.getContractAt("ERC1155Singleton", proxyAddress) as unknown as ERC1155Singleton;

    return { proxy, owner, manager };
  }

  describe("Deployment", function () {
    it("should deploy contract", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      expect(proxy).to.exist;
      expect(owner).to.exist;
    });
    it("the manager is approved for all tokens of the owner", async function () {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, manager] = await ethers.getSigners();

      const isApprovedForAll = await proxy.isApprovedForAll(owner.address, manager.address);

      expect(isApprovedForAll).to.equal(true);
    });
  });

  describe("ERC165 Interface support", function () {
    it("should support ERC165 interface", async () => {
      const { proxy } = await loadFixture(deploy);

      expect(await proxy.supportsInterface(INTERFACE_ID_ERC165)).to.equal(true);
    });
    it("should support ERC1155 interface", async () => {
      const { proxy } = await loadFixture(deploy);

      expect(await proxy.supportsInterface(INTERFACE_ID_ERC1155)).to.equal(true);
    });
    it("should support ERC2981 interface", async () => {
      const { proxy } = await loadFixture(deploy);

      expect(await proxy.supportsInterface(INTERFACE_ID_ERC2981)).to.equal(true);
    });
    it("should support Access Control interface", async () => {
      const { proxy } = await loadFixture(deploy);

      expect(await proxy.supportsInterface(INTERFACE_ID_ACCESS_CONTROL)).to.equal(true);
    });
  });

  describe("ERC2981 Compliance", function () {
    it('feeDenominator returns BASE_POINTS', async function () {
      const { proxy } = await loadFixture(deploy);
      const feeDenominator = await proxy.feeDenominator();
      expect(feeDenominator).to.equal(BASE_POINTS);
    });
    it('setDefaultRoyalty correctly sets default royalty', async function () {
      const { proxy, owner } = await loadFixture(deploy);

      await proxy.setDefaultRoyalty(owner.address, ROYALTY, { from: owner.address });
      const [receiver, royaltyFraction] = await proxy.royaltyInfo(1, BASE_POINTS);
      expect(receiver).to.equal(owner.address);
      expect(royaltyFraction).to.equal(ROYALTY);
    });

    it('deleteDefaultRoyalty correctly removes default royalty', async function () {
      const { proxy, owner } = await loadFixture(deploy);

      await proxy.setDefaultRoyalty(owner.address, ROYALTY, { from: owner.address });
      await proxy.deleteDefaultRoyalty({ from: owner.address });

      const [receiver, royaltyFraction] = await proxy.royaltyInfo(1, BASE_POINTS);
      expect(receiver).to.equal(ZERO_ADDRESS);
      expect(royaltyFraction).to.equal(0);
    });
    it('setTokenRoyalty correctly sets royalty for specific token', async function () {
      const { proxy, owner } = await loadFixture(deploy);

      await proxy.setTokenRoyalty(1, owner.address, ROYALTY, { from: owner.address });
      const [receiver, royaltyFraction] = await proxy.royaltyInfo(1, BASE_POINTS);
      expect(receiver).to.equal(owner.address);
      expect(royaltyFraction).to.equal(ROYALTY);
    });
    it('resetTokenRoyalty correctly resets royalty for specific token', async function () {
      const { proxy, owner } = await loadFixture(deploy);

      await proxy.setTokenRoyalty(1, owner.address, ROYALTY, { from: owner.address });
      await proxy.resetTokenRoyalty(1, { from: owner.address });
      const [receiver, royaltyFraction] = await proxy.royaltyInfo(1, BASE_POINTS);
      expect(receiver).to.equal(ZERO_ADDRESS);
      expect(royaltyFraction).to.equal(0);
    });
    it("should correctly return royalty info for a token", async () => {
      const { proxy, owner } = await loadFixture(deploy);

      await proxy.setTokenRoyalty(1, owner.address, ROYALTY);
      const [receiver, royaltyFraction] = await proxy.royaltyInfo(1, BASE_POINTS);
      expect(receiver).to.equal(owner.address);
      expect(royaltyFraction).to.equal(ROYALTY);
    });

    it("should return zero royalty info for token without royalty", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [receiver, royaltyFraction] = await proxy.royaltyInfo(1, BASE_POINTS);
      expect(receiver).to.equal(ZERO_ADDRESS);
      expect(royaltyFraction).to.equal(0);
    });
  })

  describe("Minting", function () {
    it("should mint a token", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      await proxy.mint(owner.address, 1, ZERO_BYTES32);
      const balance = await proxy.balanceOf(owner.address, 1);
      expect(balance).to.equal(1);
    });

    it("should mint multiple tokens", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      await proxy.mintBatch(
        owner.address,
        [1, 1],
        ZERO_BYTES32
      );
      const balance1 = await proxy.balanceOf(owner.address, 1);
      const balance2 = await proxy.balanceOf(owner.address, 2);
      expect(balance1).to.equal(1);
      expect(balance2).to.equal(1);
    });

    it("should reject a mint if not an owner", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_, _manager, satoshi] = await ethers.getSigners();
      await expect(
        proxy
          .connect(satoshi)
          .mint(satoshi.address, 1, ZERO_BYTES32)
      ).to.be.reverted;
    });
  });

  describe("Burning", function () {
    it("should burn a token", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      await proxy.mint(owner.address, 1, ZERO_BYTES32);
      await proxy.burn(owner.address, 1, 1);
      const balance = await proxy.balanceOf(owner.address, 1);
      expect(balance).to.equal(0);
    });

    it("should burn multiple tokens", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      await proxy.mintBatch(
        owner.address,
        [1, 1],
        ZERO_BYTES32
      );
      await proxy.burnBatch(owner.address, [1, 2], [1, 1]);
      const balance1 = await proxy.balanceOf(owner.address, 1);
      const balance2 = await proxy.balanceOf(owner.address, 2);
      expect(balance1).to.equal(0);
      expect(balance2).to.equal(0);
    });

    it("should reject a burn if not an owner", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      await proxy.mint(owner.address, 1, ZERO_BYTES32);
      await expect(proxy.connect(satoshi).burn(satoshi.address, 1, 1)).to.be
        .reverted;
    });
  });

  describe("Transferring", function () {
    it("should safely transfer a token from one account to another", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      await proxy.mint(owner.address, 1, ZERO_BYTES32);
      await proxy.safeTransferFrom(
        owner.address,
        satoshi.address,
        1,
        1,
        ZERO_BYTES32
      );
      const balance = await proxy.balanceOf(satoshi.address, 1);
      expect(balance).to.equal(1);
    });

    it("should safely transfer multiple tokens from one account to another", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      await proxy.mintBatch(
        owner.address,
        [1, 1],
        ZERO_BYTES32
      );
      await proxy.safeBatchTransferFrom(
        owner.address,
        satoshi.address,
        [1, 2],
        [1, 1],
        ZERO_BYTES32
      );
      const balance1 = await proxy.balanceOf(satoshi.address, 1);
      const balance2 = await proxy.balanceOf(satoshi.address, 2);
      expect(balance1).to.equal(1);
      expect(balance2).to.equal(1);
    });

    it("should reject a transfer if not an owner", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      await proxy.mint(owner.address, 1, ZERO_BYTES32);


      await expect(
        proxy
          .connect(satoshi)
          .safeTransferFrom(
            satoshi.address,
            satoshi.address,
            1,
            1,
            ZERO_BYTES32
          )
      ).to.be.reverted;
    });
    it("allows the manager to transfer a token of the owner", async function () {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, manager, satoshi] = await ethers.getSigners();

      // Mint a token to the owner
      await proxy.mint(owner.address, 100, ZERO_BYTES32);

      // Verify that owner owns the token
      let balance = await proxy.balanceOf(owner.address, 1);
      expect(balance).to.equal(100);

      // Try to transfer a token from the owner to another address by the manager
      await proxy.connect(manager).safeTransferFrom(owner.address, satoshi.address, 1, 50, ZERO_BYTES32);

      // Verify that owner's balance has decreased
      balance = await proxy.balanceOf(owner.address, 1);
      expect(balance).to.equal(50);

      // Verify that recipient's balance has increased
      balance = await proxy.balanceOf(satoshi.address, 1);
      expect(balance).to.equal(50);
    });
  });

  describe("Approvals", function () {
    it("should set approval for all", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      await proxy.setApprovalForAll(satoshi.address, true);
      const isApproved = await proxy.isApprovedForAll(owner.address, satoshi.address);
      expect(isApproved).to.equal(true);
    });

    it("should revoke approval for all", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      await proxy.setApprovalForAll(satoshi.address, true);
      await proxy.setApprovalForAll(satoshi.address, false);
      const isApproved = await proxy.isApprovedForAll(owner.address, satoshi.address);
      expect(isApproved).to.equal(false);
    });
  });

  describe("Access Control", function () {
    it("should set the DEFAULT_ADMIN_ROLE to the owner/vault", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager] = await ethers.getSigners();

      const hasManagerRole = await proxy.hasRole(DEFAULT_OWNER_ROLE, owner.address);

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

      await expect(proxy.connect(satoshi).grantRole(MANAGER_ROLE, finney.address)).to.be.reverted;
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

      await expect(proxy.connect(satoshi).revokeRole(MANAGER_ROLE, satoshi.address)).to.be.reverted;
    });
    it("should only allow an account with the DEFAULT_ADMIN_ROLE to grant other roles", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi, finney] = await ethers.getSigners();
      const randomRole = createBytes32("RANDOM_ROLE");
      await proxy.grantRole(randomRole, finney.address);
      await expect(proxy.connect(satoshi).grantRole(randomRole, finney.address)).to.be.reverted;
    });

    it("should only allow an account with the DEFAULT_ADMIN_ROLE to revoke other roles", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi, finney] = await ethers.getSigners();
      const randomRole = createBytes32("RANDOM_ROLE");
      await proxy.grantRole(randomRole, finney.address);
      await proxy.revokeRole(randomRole, finney.address);
      await expect(proxy.connect(satoshi).revokeRole(randomRole, finney.address)).to.be.reverted;
    });
  });

  describe("Manager Transferring", function () {
    it("should safely transfer a token from one account to another by manager", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();

      await proxy.mint(owner.address, 1, ZERO_BYTES32);
      await proxy.managerSafeTransferFrom(
        owner.address,
        satoshi.address,
        1,
        1,
        ZERO_BYTES32
      );
      const balance = await proxy.balanceOf(satoshi.address, 1);
      expect(balance).to.equal(1);
    });

    it("should reject a transfer by non-admin", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      await proxy.mint(owner.address, 1, ZERO_BYTES32);
      await expect(
        proxy
          .connect(satoshi)
          .managerSafeTransferFrom(
            satoshi.address,
            satoshi.address,
            1,
            1,
            ZERO_BYTES32
          )
      ).to.be.reverted;
    });

    it("should safely transfer multiple tokens from one account to another by owner as a manager", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      await proxy.mintBatch(
        owner.address,
        [1, 1],
        ZERO_BYTES32
      );
      await proxy.managerSafeBatchTransferFrom(
        owner.address,
        satoshi.address,
        [1, 2],
        [1, 1],
        ZERO_BYTES32
      );
      const balance1 = await proxy.balanceOf(satoshi.address, 1);
      const balance2 = await proxy.balanceOf(satoshi.address, 2);
      expect(balance1).to.equal(1);
      expect(balance2).to.equal(1);
    });

    it("should reject a batch transfer by non-admin", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      await proxy.mintBatch(
        owner.address,
        [1, 1],
        ZERO_BYTES32
      );
      await expect(
        proxy
          .connect(satoshi)
          .managerSafeBatchTransferFrom(
            satoshi.address,
            satoshi.address,
            [1, 2],
            [1, 1],
            ZERO_BYTES32
          )
      ).to.be.reverted;
    });
  });
  describe("increaseSupply and increaseSupplyBatch functions", function () {
    it("should increase the supply of an existing token", async function () {
      const { proxy, owner, manager } = await loadFixture(deploy);
      const tokenId = 0;
      const amount = 10;
      const initialSupply = await proxy.balanceOf(owner.address, tokenId);

      await proxy.connect(manager).increaseSupply(owner.address, tokenId, amount, ZERO_BYTES32);
      const newSupply = await proxy.balanceOf(owner.address, tokenId);
      expect(newSupply).to.equal(initialSupply.add(amount));
    });

    it("should revert for non-existing token in increaseSupply", async function () {
      const { proxy, owner, manager } = await loadFixture(deploy);
      const nonExistentTokenId = 1000;
      const amount = 10;
      await expect(proxy.connect(manager).increaseSupply(owner.address, nonExistentTokenId, amount, ZERO_BYTES32)).to.be.revertedWith("Token id must exist.");
    });

    it("should increase the supply of multiple existing tokens in a batch", async function () {
      const { proxy, owner, manager } = await loadFixture(deploy);
      const ids = [0, 1];
      const amounts = [5, 7];
      const initialSupplies = await Promise.all(ids.map(id => proxy.balanceOf(owner.address, id)));

      await proxy.connect(manager).increaseSupplyBatch(owner.address, ids, amounts, ZERO_BYTES32);

      for (let i = 0; i < ids.length; i++) {
        const newSupply = await proxy.balanceOf(owner.address, ids[i]);
        expect(newSupply).to.equal(initialSupplies[i].add(amounts[i]));
      }
    });

    it("should revert for non-existing token in increaseSupplyBatch", async function () {
      const { proxy, owner, manager } = await loadFixture(deploy);
      const ids = [0, 1000]; // 1000 is a non-existing token ID
      const amounts = [5, 7];
      await expect(proxy.connect(manager).increaseSupplyBatch(owner.address, ids, amounts, ZERO_BYTES32)).to.be.revertedWith("Token id must exist.");
    });

    it("should revert for mismatched input arrays in increaseSupplyBatch", async function () {
      const { proxy, owner, manager } = await loadFixture(deploy);
      const ids = [0];
      const amounts = [5, 7]; // Mismatched lengths
      await expect(proxy.connect(manager).increaseSupplyBatch(owner.address, ids, amounts, ZERO_BYTES32)).to.be.revertedWith("Mismatched input arrays.");
    });
  });

  describe("Role Management", function () {
    it("allows a role to be granted to an account", async function () {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      const newRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('NEW_ROLE'));


      await proxy.grantRole(newRole, satoshi.address);

      expect(await proxy.hasRole(newRole, satoshi.address)).to.equal(true);
    });

    it("reverts when attempting to grant a role to the zero address", async function () {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      const newRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('NEW_ROLE'));

      await expect(proxy.grantRole(newRole, ZERO_ADDRESS)).to.be.revertedWith("Address cannot be zero");
    });

    it("reverts when a non-admin tries to grant a role", async function () {
      const { proxy, owner } = await loadFixture(deploy);
      const [_owner, _manager, satoshi] = await ethers.getSigners();
      const newRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('NEW_ROLE'));


      await expect(proxy.connect(satoshi).grantRole(newRole, satoshi.address)).to.be.reverted;
    });
  });
});
