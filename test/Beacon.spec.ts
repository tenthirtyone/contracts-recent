import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { abi as MockERC1155SingletonV2ABI, bytecode as MockERC1155SingletonV2Bytcode } from "../artifacts/contracts/mocks/MockERC1155SingletonV2.sol/MockERC1155SingletonV2.json";
import { abi as ERC1155SingletonABI, bytecode as ERC1155Bytecode } from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import { bytecode as BeaconBytecode } from "../artifacts/contracts/Beacon.sol/Beacon.json";
import {
  createSalt,
  DEFAULT_OWNER_ROLE,
  MANAGER_ROLE,
  CONTRACT_SALT, ZERO_BYTES32
} from "./utils";


import { ERC1155Singleton } from "../typechain"

const hre = require("hardhat");
const ethers = hre.ethers;

describe("UpgradeableBeacon", function () {
  const SALT = createSalt(CONTRACT_SALT);

  async function deploy() {
    const [owner, manager] = await ethers.getSigners();

    const SingletonFactory = await ethers.getContractFactory(
      "MockSingletonFactory"
    );

    const factoryInstance = await SingletonFactory.deploy({ gasLimit: 30000000 });

    const erc1155Address = await factoryInstance.callStatic.computeAddress(
      SALT,
      ERC1155Bytecode
    );

    const erc1155AddressV2 = await factoryInstance.callStatic.computeAddress(
      SALT,
      MockERC1155SingletonV2Bytcode
    );
    await factoryInstance.deploy(SALT, ERC1155Bytecode, { gasLimit: 30000000 });
    await factoryInstance.deploy(SALT, MockERC1155SingletonV2Bytcode, { gasLimit: 30000000 });

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

    return { beacon, proxy, owner, manager, erc1155Address, erc1155AddressV2, factoryInstance }
  }

  describe("Deployment", function () {
    it("should deploy the contracts", async () => {
      const { owner, manager, proxy, beacon } = await loadFixture(deploy);

      expect(proxy).to.exist;
      expect(beacon).to.exist;
    });


    it("should set the DEFAULT_ADMIN_ROLE to the owner/vault", async () => {
      const { proxy, owner } = await loadFixture(deploy);

      const hasRole = await proxy.hasRole(DEFAULT_OWNER_ROLE, owner.address);

      expect(hasRole).to.equal(true);
    });

    it("should set the MANAGER_ROLE to the owner/vault", async () => {
      const { proxy, owner } = await loadFixture(deploy);

      const hasRole = await proxy.hasRole(MANAGER_ROLE, owner.address);

      expect(hasRole).to.equal(true);
    });
    it("should set the MANAGER_ROLE to the manager", async () => {
      const { proxy, manager } = await loadFixture(deploy);

      const hasRole = await proxy.hasRole(MANAGER_ROLE, manager.address);

      expect(hasRole).to.equal(true);
    });
    it("should set the MANAGER_ROLE to the manager", async () => {
      const { proxy, manager } = await loadFixture(deploy);

      const hasRole = await proxy.hasRole(MANAGER_ROLE, manager.address);

      expect(hasRole).to.equal(true);
    });
    it("should upgrade to the next version of the contract", async () => {
      const { proxy, owner, manager, beacon, erc1155AddressV2, factoryInstance } = await loadFixture(deploy);

      await proxy.mint(owner.address, 1, ZERO_BYTES32);

      expect(await proxy.balanceOf(owner.address, 1)).to.equal(1);
      expect(await proxy.version()).to.equal(1);

      await beacon.upgradeTo(erc1155AddressV2);

      expect(await proxy.balanceOf(owner.address, 1)).to.equal(1);
      expect(await proxy.version()).to.equal(2);

    });
  });
});
