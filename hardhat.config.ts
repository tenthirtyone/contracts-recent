require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@typechain/hardhat");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: false,
        runs: 1,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  networks: {},
  etherscan: {
    apiKey: {
      sepolia: process.env.ALCHEMY_TEST_KEY1,
      mainnet: process.env.ALCHEMY_TEST_KEY1,
      zkEVMtestnet: process.env.ALCHEMY_TEST_KEY2,
      zkEVMMainnet: process.env.ALCHEMY_TEST_KEY3,
      polygon: process.env.ALCHEMY_TEST_KEY2,
      amoy: process.env.ALCHEMY_TEST_KEY2,
      polygonMumbai: process.env.ALCHEMY_TEST_KEY2,
      arbitrumOne: process.env.ALCHEMY_TEST_KEY4,
      optimisticEthereum: process.env.ALCHEMY_TEST_KEY5,
    },
    customChains: [
      {
        network: "zkEVMtestnet",
        chainId: 1442,
        urls: {
          apiURL: "https://api-testnet-zkevm.polygonscan.com/api",
          browserURL: "https://testnet-zkevm.polygonscan.com/",
        },
      },
      {
        network: "zkEVMMainnet",
        chainId: 1101,
        urls: {
          apiURL: "https://api-testnet-zkevm.polygonscan.com/api",
          browserURL: "https://testnet-zkevm.polygonscan.com/",
        },
      },
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://rpc-amoy.polygon.technology/",
          browserURL: "https://www.oklink.com/amoy",
        },
      },
    ],
  },
};
