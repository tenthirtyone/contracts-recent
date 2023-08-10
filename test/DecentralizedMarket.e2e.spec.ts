
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { abi as ERC1155SingletonABI, bytecode as ERC1155Bytecode } from "../artifacts/contracts/ERC1155Singleton.sol/ERC1155Singleton.json";
import { bytecode as BeaconBytecode } from "../artifacts/contracts/Beacon.sol/Beacon.json";
import {
  createSalt,
  ZERO_BYTES32,
  ZERO_ADDRESS,
  CONTRACT_SALT,
  ROYALTY,
  BASE_POINTS
} from "./utils";

import { ERC1155Singleton, MockMarketplace } from "../typechain"

const hre = require("hardhat");
const ethers = hre.ethers;

describe("ERC1155Proxy", function () {
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
      callData, { gasLimit: 30000000 }
    );

    const proxy = await ethers.getContractAt("ERC1155Singleton", proxyAddress) as unknown as ERC1155Singleton;

    const Marketplace = await ethers.getContractFactory(
      "MockMarketplace"
    );
    const marketplace = (await Marketplace.deploy({ gasLimit: 30000000 })) as unknown as MockMarketplace;


    await proxy.connect(owner).setApprovalForAll(marketplace.address, true);
    await proxy.connect(manager).setApprovalForAll(marketplace.address, true);


    return { proxy, owner, manager, marketplace };
  }


  describe("Decentralized Marketplace", function () {
    describe("User Actions", () => {
      it("Direct Sale", async () => {
        const { proxy, owner, manager, marketplace } = await loadFixture(deploy);
        const [_owner, _manager, satoshi, conan] = await ethers.getSigners();

        // Mint a token to the owner
        await proxy.mint(owner.address, 10, ZERO_BYTES32);

        // Token is direct sale from vault to the user, Satoshi.
        await proxy.connect(manager).safeTransferFrom(owner.address, satoshi.address, 1, 1, ZERO_BYTES32);

        // Check that the token was transferred to Satoshi
        const balance = await proxy.balanceOf(satoshi.address, 1);
        expect(balance).to.equal(1);
      })
      it("Trade", async () => {
        const { proxy, owner, manager, marketplace } = await loadFixture(deploy);
        const [_owner, _manager, satoshi, conan] = await ethers.getSigners();

        // Mint a token to the owner
        await proxy.mint(owner.address, 10, ZERO_BYTES32);

        // Token is direct sale from vault to the user, Satoshi.
        await proxy.connect(manager).safeTransferFrom(owner.address, satoshi.address, 1, 1, ZERO_BYTES32);

        await proxy.connect(satoshi).safeTransferFrom(satoshi.address, conan.address, 1, 1, ZERO_BYTES32);

        // Check that the token was transferred to Conan
        const balance = await proxy.balanceOf(conan.address, 1);
        expect(balance).to.equal(1);
      })
      it("Secondary Sale", async () => {
        const { proxy, owner, manager, marketplace } = await loadFixture(deploy);
        const [_owner, _manager, satoshi, conan] = await ethers.getSigners();

        // Mint a token to the owner
        await proxy.mint(owner.address, 10, ZERO_BYTES32);

        // Token is direct sale from vault to the user, Satoshi.
        await proxy.connect(manager).safeTransferFrom(owner.address, satoshi.address, 1, 1, ZERO_BYTES32);

        // Satoshi allows the marketplace to list their token
        await proxy.connect(satoshi).setApprovalForAll(marketplace.address, true);
        // Create a listing in the marketplace
        await marketplace.connect(satoshi).createListing(proxy.address, 1, 1, ethers.utils.parseEther("1.0"));

        // Satoshi buys the listing
        await marketplace.connect(conan).buyListing(1, { value: ethers.utils.parseEther("1.0") });

        // Check that the token was transferred to Conan
        const balance = await proxy.balanceOf(conan.address, 1);
        expect(balance).to.equal(1);

        // Check that the listing was removed
        const listing = await marketplace.listings(1);
        expect(listing.seller).to.equal(ZERO_ADDRESS);
      })
      it("Secondary Sale with Royalty", async () => {
        const { proxy, owner, manager, marketplace } = await loadFixture(deploy);
        const [_owner, _manager, satoshi, conan, royaltyReceiver] = await ethers.getSigners();

        await proxy.connect(manager).setDefaultRoyalty(royaltyReceiver.address, ROYALTY);
        // Mint a token to the owner
        await proxy.mint(owner.address, 10, ZERO_BYTES32);

        // Token is direct sale from vault to the user, Satoshi.
        await proxy.connect(manager).safeTransferFrom(owner.address, satoshi.address, 1, 1, ZERO_BYTES32);
        // Check that the token was transferred to Satoshi
        expect(await proxy.balanceOf(satoshi.address, 1)).to.equal(1);
        // Satoshi allows the marketplace to list their token
        await proxy.connect(satoshi).setApprovalForAll(marketplace.address, true);
        // Create a listing in the marketplace
        await marketplace.connect(satoshi).createListing(proxy.address, 1, 1, ethers.utils.parseEther("1.0"));
        const royaltyReceiverStartingBalance = await ethers.provider.getBalance(royaltyReceiver.address);

        // Conan buys the listing
        const tx = await marketplace.connect(conan).buyListingPayRoyalty(1, { value: ethers.utils.parseEther("1.0") });
        const receipt = await tx.wait();

        // Check that the token was transferred to Conan
        expect(await proxy.balanceOf(conan.address, 1)).to.equal(1);
        expect(await proxy.balanceOf(satoshi.address, 1)).to.equal(0);

        // Check that the listing was removed
        const listing = await marketplace.listings(1);
        expect(listing.seller).to.equal(ZERO_ADDRESS);

        // Calculate expected royalty amount
        const salePrice = ethers.utils.parseEther("1.0");
        const expectedRoyaltyAmount = salePrice.mul(ROYALTY).div(BASE_POINTS);

        // Fetch the royalty receiver's ending balance and verify the royalty payment
        const royaltyReceiverEndingBalance = await ethers.provider.getBalance(royaltyReceiver.address);
        expect(royaltyReceiverEndingBalance.sub(royaltyReceiverStartingBalance)).to.equal(expectedRoyaltyAmount);
      })
    })
    describe("Experimental", () => {
      // This is currently a work in progress. We want the funds to go to the External Wallet from the Royalty account. 
      // This may require a manager contract with a payable fallback that directs payments to this address. To list on 
      // this mock contract the manager must transfer to themselves because of approvals, or we need another function.
      it("allows a manager to create a listing", async function () {
        const { proxy, owner, marketplace } = await loadFixture(deploy);
        const [_owner, manager, satoshi] = await ethers.getSigners();

        // Mint a token to the owner
        await proxy.mint(owner.address, 1, ZERO_BYTES32);


        expect(await proxy.isApprovedForAll(owner.address, marketplace.address)).to.equal(true)

        await proxy.connect(manager).safeTransferFrom(owner.address, manager.address, 1, 1, ZERO_BYTES32);
        await marketplace.connect(manager).createListing(proxy.address, 1, 1, ethers.utils.parseEther("1.0"));

      });

      it("allows a user to buy a listing", async function () {
        const { proxy, owner, manager, marketplace } = await loadFixture(deploy);
        const [_owner, _manager, satoshi] = await ethers.getSigners();

        // Mint a token to the owner
        await proxy.mint(owner.address, 1, ZERO_BYTES32);

        await proxy.connect(manager).safeTransferFrom(owner.address, manager.address, 1, 1, ZERO_BYTES32);
        // Create a listing in the marketplace
        await marketplace.connect(manager).createListing(proxy.address, 1, 1, ethers.utils.parseEther("1.0"));

        // Satoshi buys the listing
        await marketplace.connect(satoshi).buyListing(1, { value: ethers.utils.parseEther("1.0") });

        // Check that the token was transferred to Satoshi
        const balance = await proxy.balanceOf(satoshi.address, 1);
        expect(balance).to.equal(1);

        // Check that the listing was removed
        const listing = await marketplace.listings(1);
        expect(listing.seller).to.equal(ZERO_ADDRESS);
      });


      it("reverts when a user tries to buy a listing with insufficient Ether", async function () {
        const { proxy, owner, manager, marketplace } = await loadFixture(deploy);
        const [_owner, _manager, satoshi] = await ethers.getSigners();


        // Mint a token to the owner
        await proxy.mint(owner.address, 1, ZERO_BYTES32);

        // Create a listing in the marketplace
        await marketplace.connect(owner).createListing(proxy.address, 1, 1, ethers.utils.parseEther("1.0"));

        // Satoshi tries to buy the listing with 0.5 Ether, which is not enough
        await expect(marketplace.connect(satoshi).buyListing(1, { value: ethers.utils.parseEther("0.5") })).to.be.revertedWith("Not enough Ether for this transaction.");
      });

      it("reverts when a user tries to create a listing without owning the token", async function () {
        const { proxy, owner, manager, marketplace } = await loadFixture(deploy);
        const [_owner, _manager, satoshi] = await ethers.getSigners();

        // Satoshi tries to create a listing without owning the token
        await expect(marketplace.connect(satoshi).createListing(proxy.address, 1, 1, ethers.utils.parseEther("1.0"))).to.be.reverted;
      });

      it("completes a lifecycle of mint, sell, buy, transfer, and resell", async function () {
        const { proxy, owner, manager, marketplace } = await loadFixture(deploy);
        const [_owner, _manager, buyer1, buyer2] = await ethers.getSigners();

        // Mint a token to the owner
        await proxy.mint(owner.address, 1, ZERO_BYTES32);

        // Owner lists the token for sale
        await marketplace.connect(owner).createListing(proxy.address, 1, 1, ethers.utils.parseEther("1.0"));

        // Buyer1 buys the token
        await marketplace.connect(buyer1).buyListing(1, { value: ethers.utils.parseEther("1.0") });

        // Check that the token was transferred to Buyer1
        let balance = await proxy.balanceOf(buyer1.address, 1);
        expect(balance).to.equal(1);

        // Buyer1 transfers the token to Buyer2 for free
        await proxy.connect(buyer1).safeTransferFrom(buyer1.address, buyer2.address, 1, 1, ZERO_BYTES32);

        // Check that the token was transferred to Buyer2
        balance = await proxy.balanceOf(buyer2.address, 1);
        expect(balance).to.equal(1);

        // Buyer2 approves marketplace to sell on his behalf
        await proxy.connect(buyer2).setApprovalForAll(marketplace.address, true);

        // Buyer2 transfers the token back to Buyer1 for some ETH by creating a listing
        await marketplace.connect(buyer2).createListing(proxy.address, 1, 1, ethers.utils.parseEther("0.5"));

        // Buyer1 buys back the token
        await marketplace.connect(buyer1).buyListing(2, { value: ethers.utils.parseEther("0.5") });

        // Check that the token was transferred back to Buyer1
        balance = await proxy.balanceOf(buyer1.address, 1);
        expect(balance).to.equal(1);
      });
      describe("Transfers", function () {
        // Test case 1.1
        it("allows a user to transfer a unit of a product", async function () {
          const { proxy, owner, manager } = await loadFixture(deploy);
          const [_owner, _manager, recipient] = await ethers.getSigners();
          // Mint a token to the owner
          await proxy.mint(owner.address, 1, ZERO_BYTES32);

          // Owner transfers a unit of the token to the recipient
          await proxy.connect(owner).safeTransferFrom(owner.address, recipient.address, 1, 1, ZERO_BYTES32);

          // Check that the token was transferred to the recipient
          const balance = await proxy.balanceOf(recipient.address, 1);
          expect(balance).to.equal(1);
        });

        // Test case 1.2
        it("allows a user to transfer a multiple units of a product", async function () {
          const { proxy, owner, manager } = await loadFixture(deploy);
          const [_owner, _manager, recipient] = await ethers.getSigners();
          // Mint 5 tokens to the owner
          await proxy.mint(owner.address, 5, ZERO_BYTES32);

          // Owner transfers 5 units of the token to the recipient
          await proxy.connect(owner).safeTransferFrom(owner.address, recipient.address, 1, 5, ZERO_BYTES32);

          // Check that 5 tokens were transferred to the recipient
          const balance = await proxy.balanceOf(recipient.address, 1);
          expect(balance).to.equal(5);
        });
      });
      describe("Sales", function () {

        // Test case 2.1
        it("allows a user to buy a product, demonstrating a sale", async function () {
          const { proxy, owner, manager, marketplace } = await loadFixture(deploy);
          const [_owner, _manager, buyer] = await ethers.getSigners();
          // Mint a token to the owner
          await proxy.mint(owner.address, 1, ZERO_BYTES32);

          // Owner lists the token for sale
          await marketplace.connect(owner).createListing(proxy.address, 1, 1, ethers.utils.parseEther("1.0"));

          // Buyer buys the token, thus a sale occurs
          await marketplace.connect(buyer).buyListing(1, { value: ethers.utils.parseEther("1.0") });

          // Check that the token was transferred to the buyer
          const balance = await proxy.balanceOf(buyer.address, 1);
          expect(balance).to.equal(1);
        });
      });
    });
  })

});
