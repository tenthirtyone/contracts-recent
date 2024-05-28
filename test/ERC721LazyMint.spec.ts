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
  CONTRACT_NAME,
  CONTRACT_SYMBOL,
  ZERO_ADDRESS,
  CONTRACT_SALT,
  ROYALTY,
  CONTRACT_URI_MIMETYPE,
  CONTRACT_URI,
  TOKEN_URI,
  LICENSE_URI,
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

    const erc721LazyMintAddress =
      await factoryInstance.callStatic.computeAddress(SALT, ERC721Bytecode);

    await factoryInstance.deploy(SALT, ERC721Bytecode, { gasLimit: 30000000 });

    const abiCoder = new ethers.utils.AbiCoder();
    const encodedParameters = abiCoder.encode(
      ["address", "address"],
      [erc721LazyMintAddress, owner.address]
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
      CONTRACT_NAME,
      CONTRACT_SYMBOL,
      CONTRACT_URI,
      TOKEN_URI,
      LICENSE_URI,
      ROYALTY,
    ]);

    const proxyAddress = await beacon.callStatic.deployProxyContract(callData);

    await beacon.deployProxyContract(callData);

    const proxy = (await ethers.getContractAt(
      "ERC721LazyMint",
      proxyAddress
    )) as unknown as ERC721Singleton;

    return { proxy, owner, manager };
  }

  describe("Deployment", function () {
    it.only("should deploy contract", async () => {
      const { proxy, owner } = await loadFixture(deploy);

      expect(proxy).to.exist;
      expect(owner).to.exist;
    });
  });
});
``;
