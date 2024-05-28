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

import { SFTLazyMinter } from "../lib/LazyMinter";

import { ERC1155LazyMint, MockNoPayContract } from "../typechain";

const hre = require("hardhat");
const ethers = hre.ethers;

describe("Lazy Mint", function () {
  const SALT = createSalt(CONTRACT_SALT);

  async function deploy() {
    const [owner, redeemer, satoshi] = await ethers.getSigners();

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

    return { proxy, owner, redeemer, satoshi };
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
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 1;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        10,
        owner.address
      );

      const redeemTx = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        });
      const redeemReceipt = await redeemTx.wait();

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(1);
    });
    it("should correctly update the balance on redemption", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("1.0");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 1;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        10,
        owner.address
      );
      const beginBalance = await ethers.provider.getBalance(owner.address);

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(0);
      const redeemTx = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        });
      const redeemReceipt = await redeemTx.wait();

      const totalSupply = await proxy.totalSupply(tokenId);

      const endBalance = await ethers.provider.getBalance(owner.address);

      const balanceDelta = endBalance.sub(beginBalance);

      expect(balanceDelta).to.equal(tokenPrice);
      expect(totalSupply).to.equal(supply);
      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(1);
    });
    it("should send payment to the voucher recipient.", async function () {
      const { proxy, owner, redeemer, satoshi } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("1.0");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        10,
        satoshi.address
      );
      const beginBalance = await ethers.provider.getBalance(satoshi.address);

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(0);
      const redeemTx = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        });
      await redeemTx.wait();

      const endBalance = await ethers.provider.getBalance(satoshi.address);

      const balanceDelta = endBalance.sub(beginBalance);

      expect(balanceDelta).to.equal(tokenPrice);
    });
    it("should correctly update token URI on voucher redemption", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("1.0");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 1;
      const tokenUri =
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        tokenUri,
        tokenPrice,
        10,
        owner.address
      );

      await proxy
        .connect(redeemer)
        .redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        });
      expect(await proxy.tokenURI(tokenId)).to.equal(tokenUri);
    });
    it("should mint up to the maxSupply of the voucher", async () => {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("0");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 2;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        supply,
        owner.address
      );

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(0);

      const redeemTx = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        });
      const redeemTx2 = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        });

      await redeemTx.wait();
      await redeemTx2.wait();

      const totalSupply = await proxy.totalSupply(tokenId);

      expect(totalSupply).to.equal(supply);
      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(supply);
    });
    it("should fail to redeem an NFT when totalSupply will be > maxSupply", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("0");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 2;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        supply,
        owner.address
      );

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(0);

      const redeemTx = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        });

      await expect(
        proxy.redeem(redeemer.address, supply + 1, voucher, signature, {
          value: tokenPrice,
        }) // @ts-ignore
      ).to.be.reverted;
    });
    it("should fail to redeem an NFT voucher that's signed by an unauthorized account", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("0");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: redeemer,
      });

      const tokenId = 1;
      const supply = 2;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        supply,
        owner.address
      );

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(0);

      await proxy.connect(redeemer);

      await expect(
        proxy.redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        }) // @ts-ignore
      ).to.be.reverted;
    });
    it("should fail to redeem an NFT voucher that's been modified", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("0");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 2;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        supply,
        owner.address
      );

      voucher.recipient = redeemer.address;

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(0);

      await proxy.connect(redeemer);

      await expect(
        proxy.redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        }) // @ts-ignore
      ).to.be.reverted;
    });
    it("should handle overpayment scenarios correctly", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("1.0");
      const tokenPriceX2 = ethers.utils.parseEther("2.0");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 1;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        10,
        owner.address
      );
      const beginBalance = await ethers.provider.getBalance(owner.address);

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(0);
      const redeemTx = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPriceX2,
        });
      const redeemReceipt = await redeemTx.wait();

      const totalSupply = await proxy.totalSupply(tokenId);

      const endBalance = await ethers.provider.getBalance(owner.address);

      const balanceDelta = endBalance.sub(beginBalance);

      expect(balanceDelta).to.equal(tokenPriceX2);
      expect(totalSupply).to.equal(supply);
      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(1);
    });
    it("should fail to redeem if payment is < minPrice", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const zeroEth = ethers.utils.parseEther("0");
      const tokenPrice = ethers.utils.parseEther("1");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 2;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        supply,
        owner.address
      );

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(0);

      await proxy.connect(redeemer);

      await expect(
        proxy.redeem(redeemer.address, 1, voucher, signature, {
          value: zeroEth,
        }) // @ts-ignore
      ).to.be.reverted;
    });
    it("should fail to redeem if the payment receiver cannot receive eth", async function () {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const NoPayContract = await ethers.getContractFactory(
        "MockNoPayContract"
      );
      const noPayContract = (await NoPayContract.deploy({
        gasLimit: 30000000,
      })) as unknown as MockNoPayContract;

      const tokenPrice = ethers.utils.parseEther("1");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 2;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        supply,
        noPayContract.address
      );

      await proxy.connect(redeemer);

      await expect(
        proxy.redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        })
      );
    });
    it("should fail to honor new vouchers for an existing tokenId after the first voucher has been redeemed", async () => {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("1.0");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 1;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        10,
        owner.address
      );

      const redeemTx = await proxy
        .connect(redeemer)
        .redeem(redeemer.address, 1, voucher, signature, {
          value: tokenPrice,
        });
      const redeemReceipt = await redeemTx.wait();

      expect(await proxy.balanceOf(redeemer.address, tokenId)).to.equal(1);
    });
    it("should fail when the voucher maxSupply is 0.", async () => {
      const { proxy, owner, redeemer } = await loadFixture(deploy);
      const tokenPrice = ethers.utils.parseEther("1.0");
      const lazyMinter = new SFTLazyMinter({
        contractAddress: proxy.address,
        signer: owner,
      });

      const tokenId = 1;
      const supply = 0;

      const { voucher, signature } = await lazyMinter.createVoucher(
        tokenId,
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        tokenPrice,
        supply,
        owner.address
      );

      await proxy.connect(redeemer);

      await expect(
        proxy.redeem(redeemer.address, 0, voucher, signature, {
          value: tokenPrice,
        }) // @ts-ignore
      ).to.be.reverted;
    });
  });
});
