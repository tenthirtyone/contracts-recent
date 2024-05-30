import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  abi as ERC721SingletonABI,
  bytecode as ERC721LazyMintBytecode,
} from "../artifacts/contracts/ERC721LazyMint.sol/ERC721LazyMint.json";
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

import { ERC721LazyMint, MockNoPayContract } from "../typechain";
import { NFTLazyMinter } from "../lib/NFTLazyMinter";

const hre = require("hardhat");
const ethers = hre.ethers;
const CHAINID = 31337;

describe("ERC721LazyMint", function () {
  const SALT = createSalt(CONTRACT_SALT);

  async function deploy() {
    const [owner, manager, redeemer, satoshi] = await ethers.getSigners();

    const SingletonFactory = await ethers.getContractFactory(
      "MockSingletonFactory"
    );
    const factoryInstance = await SingletonFactory.deploy();

    const erc721LazyMintAddress =
      await factoryInstance.callStatic.computeAddress(
        SALT,
        ERC721LazyMintBytecode
      );

    await factoryInstance.deploy(SALT, ERC721LazyMintBytecode, {
      gasLimit: 30000000,
    });

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
    )) as unknown as ERC721LazyMint;

    return { proxy, owner, manager, redeemer, satoshi };
  }

  describe("Deployment", function () {
    it("should deploy contract", async () => {
      const { proxy, owner } = await loadFixture(deploy);

      expect(proxy).to.exist;
      expect(owner).to.exist;
    });
    it("should redeem an NFT from a signed voucher", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("1.0");
      const lazyMinter = new NFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
        chainId: CHAINID,
      });

      const tokenId = 1;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        tokenPrice,
        redeemer.address
      );

      const redeemTx = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, voucher, signature, {
          value: tokenPrice,
        });
      const redeemReceipt = await redeemTx.wait();

      expect(await proxy.balanceOf(redeemer.address)).to.equal(1);
    });
    it("should send payment to the voucher recipient.", async function () {
      const { proxy, owner, redeemer, satoshi } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("1.0");
      const lazyMinter = new NFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
        chainId: CHAINID,
      });

      const tokenId = 1;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        tokenPrice,
        satoshi.address
      );
      const beginBalance = await ethers.provider.getBalance(satoshi.address);

      expect(await proxy.balanceOf(redeemer.address)).to.equal(0);
      const redeemTx = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, voucher, signature, {
          value: tokenPrice,
        });
      await redeemTx.wait();

      const endBalance = await ethers.provider.getBalance(satoshi.address);

      const balanceDelta = endBalance.sub(beginBalance);

      expect(balanceDelta).to.equal(tokenPrice);
    });
    it("should fail to redeem an NFT voucher that's signed by an unauthorized account", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("0");
      const lazyMinter = new NFTLazyMinter({
        contractAddress: proxy.address,
        signer: redeemer,
        chainId: CHAINID,
      });

      const tokenId = 1;
      const supply = 2;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        tokenPrice,
        owner.address
      );

      expect(await proxy.balanceOf(redeemer.address)).to.equal(0);

      await proxy.connect(redeemer);

      await expect(
        proxy.redeem(redeemer.address, voucher, signature, {
          value: tokenPrice,
        }) // @ts-ignore
      ).to.be.reverted;
    });
  });
  it("should fail to redeem an NFT voucher that's been modified", async function () {
    const { proxy, owner, redeemer } = await loadFixture(deploy);
    const tokenPrice = ethers.utils.parseEther("0");
    const lazyMinter = new NFTLazyMinter({
      contractAddress: proxy.address,
      signer: owner,
      chainId: CHAINID,
    });

    const tokenId = 1;
    const supply = 2;

    const { voucher, signature } = await lazyMinter.createVoucher(
      tokenId,
      tokenPrice,
      owner.address
    );

    voucher.recipient = redeemer.address;

    expect(await proxy.balanceOf(redeemer.address)).to.equal(0);

    await proxy.connect(redeemer);

    await expect(
      proxy.redeem(redeemer.address, voucher, signature, {
        value: tokenPrice,
      }) // @ts-ignore
    ).to.be.reverted;
  });
  it("should handle overpayment scenarios correctly", async function () {
    const { proxy, owner, redeemer } = await loadFixture(deploy);
    const tokenPrice = ethers.utils.parseEther("1.0");
    const tokenPriceX2 = ethers.utils.parseEther("2.0");
    const lazyMinter = new NFTLazyMinter({
      contractAddress: proxy.address,
      signer: owner,
      chainId: CHAINID,
    });

    const tokenId = 1;
    const supply = 1;

    const { voucher, signature } = await lazyMinter.createVoucher(
      tokenId,
      tokenPrice,
      owner.address
    );
    const beginBalance = await ethers.provider.getBalance(owner.address);

    expect(await proxy.balanceOf(redeemer.address)).to.equal(0);
    const redeemTx = await proxy
      .connect(redeemer)
      .redeem(redeemer.address, voucher, signature, {
        value: tokenPriceX2,
      });
    const redeemReceipt = await redeemTx.wait();

    const endBalance = await ethers.provider.getBalance(owner.address);

    const balanceDelta = endBalance.sub(beginBalance);

    expect(balanceDelta).to.equal(tokenPriceX2);
    expect(await proxy.balanceOf(redeemer.address)).to.equal(1);
  });
  it("should fail to redeem if payment is < minPrice", async function () {
    const { proxy, owner, redeemer } = await loadFixture(deploy);
    const zeroEth = ethers.utils.parseEther("0");
    const tokenPrice = ethers.utils.parseEther("1");
    const lazyMinter = new NFTLazyMinter({
      contractAddress: proxy.address,
      signer: owner,
      chainId: CHAINID,
    });

    const tokenId = 1;
    const supply = 2;

    const { voucher, signature } = await lazyMinter.createVoucher(
      tokenId,
      tokenPrice,
      owner.address
    );

    expect(await proxy.balanceOf(redeemer.address)).to.equal(0);

    await proxy.connect(redeemer);

    await expect(
      proxy.redeem(redeemer.address, voucher, signature, {
        value: zeroEth,
      }) // @ts-ignore
    ).to.be.reverted;
  });
  it("should fail to redeem if the payment receiver cannot receive eth", async function () {
    const { proxy, owner, redeemer } = await loadFixture(deploy);
    const NoPayContract = await ethers.getContractFactory("MockNoPayContract");
    const noPayContract = (await NoPayContract.deploy({
      gasLimit: 30000000,
    })) as unknown as MockNoPayContract;

    const tokenPrice = ethers.utils.parseEther("1");
    const lazyMinter = new NFTLazyMinter({
      contractAddress: proxy.address,
      signer: owner,
      chainId: CHAINID,
    });

    const tokenId = 1;
    const supply = 2;

    const { voucher, signature } = await lazyMinter.createVoucher(
      tokenId,
      tokenPrice,
      noPayContract.address
    );

    await proxy.connect(redeemer);

    await expect(
      proxy.redeem(redeemer.address, voucher, signature, {
        value: tokenPrice,
      }) // @ts-ignore
    ).to.be.reverted;
  });
  it("should fail to honor new vouchers for an existing tokenId after the first voucher has been redeemed", async () => {
    const { proxy, owner, redeemer } = await loadFixture(deploy);
    const tokenPrice = ethers.utils.parseEther("1.0");
    const lazyMinter = new NFTLazyMinter({
      contractAddress: proxy.address,
      signer: owner,
      chainId: CHAINID,
    });

    const tokenId = 1;

    const { voucher, signature } = await lazyMinter.createVoucher(
      tokenId,
      tokenPrice,
      owner.address
    );

    const redeemTx = await proxy
      .connect(redeemer)
      .redeem(redeemer.address, voucher, signature, {
        value: tokenPrice,
      });
    const redeemReceipt = await redeemTx.wait();

    expect(await proxy.balanceOf(redeemer.address)).to.equal(1);
    await expect(
      proxy.redeem(redeemer.address, voucher, signature, {
        value: tokenPrice,
      }) // @ts-ignore
    ).to.be.reverted;
  });
});
