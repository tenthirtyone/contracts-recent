import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  abi as ERC1155SingletonABI,
  bytecode as ERC1155Bytecode,
} from "../artifacts/contracts/ERC1155LazyMint.sol/ERC1155LazyMint.json";
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
  ROYALTY,
  CONTRACT_URI,
  TOKEN_URI,
  LICENSE_URI,
  CONTRACT_URI_MIMETYPE,
  SEAPORT_1_5_ADDRESS,
} from "./utils";

import { LazyMinter } from "../lib/LazyMinter";

import { ERC1155LazyMint } from "../typechain";

const hre = require("hardhat");
const ethers = hre.ethers;

describe("ERC1155Proxy", function () {
  const SALT = createSalt(CONTRACT_SALT);

  async function deploy() {
    const [owner, redeemer] = await ethers.getSigners();

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
    const encodedParameters = abiCoder.encode(
      ["address", "address"],
      [erc1155Address, owner.address]
    );
    const beaconInitCode = BeaconBytecode + encodedParameters.slice(2);

    const beaconAddress = await factoryInstance.computeAddress(
      SALT,
      beaconInitCode
    );

    await factoryInstance.deploy(SALT, beaconInitCode, { gasLimit: 30000000 });

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

    await beacon.deployProxyContract(callData);

    const proxy = (await ethers.getContractAt(
      "ERC1155LazyMint",
      proxyAddress
    )) as unknown as ERC1155LazyMint;

    return { proxy, owner, redeemer };
  }

  describe("Deployment", function () {
    it("should deploy contract", async () => {
      const { proxy, owner } = await loadFixture(deploy);
      expect(proxy).to.exist;
      expect(owner).to.exist;
    });
    it.only("Should redeem an NFT from a signed voucher", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);

      const lazyMinter = new LazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 1;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        ethers.utils.parseEther("1.0"),
        10,
        owner.address
      );
      const beginBalance = await ethers.provider.getBalance(owner.address);

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(0);
      const redeemTx = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, voucher, signature, {
          value: ethers.utils.parseEther("1.0"),
        });
      const redeemReceipt = await redeemTx.wait();

      const totalSupply = await proxy.totalSupply(tokenId);

      const endBalance = await ethers.provider.getBalance(owner.address);

      console.log(beginBalance.toString());
      console.log(endBalance.toString());

      expect(totalSupply).to.equal(supply);
      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(1);
    });
  });
});
