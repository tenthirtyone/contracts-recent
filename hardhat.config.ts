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
  networks: {
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/rl4UL7m6pq63hsJvt7BgCDfQh3u0yPxl`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    polygonMumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/5TPftgAAIT8BO-IXSUAFYyLvbKcaifmy`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    zkEVMtestnet: {
      url: `https://rpc.public.zkevm-test.net`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/l5r4TH0qpjY-OeNvsEE4jGe3Sbluf53O`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/HUzW6mMyyQQi0XnQXbaz_lRMbkEAeF9n`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    zkEVMMainnet: {
      url: "https://polygonzkevm-mainnet.g.alchemy.com/v2/RwLthW3tZQNvM8HBLZd3zhbKy90S9oTd",
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: "TRZG89K55S9UWJC9PD2FHWTV3AWNV1CYU7",
      mainnet: "TRZG89K55S9UWJC9PD2FHWTV3AWNV1CYU7",
      zkEVMtestnet: "6TDA4H3KU36XVSUYI481162XTZG9ZYF7WR",
      zkEVMMainnet: "VEZ1D87WT6EMK11GEANXB4SKKREKYQV1HK",
      polygon: "6TDA4H3KU36XVSUYI481162XTZG9ZYF7WR",
      polygonMumbai: "6TDA4H3KU36XVSUYI481162XTZG9ZYF7WR",
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
    ],
  },
};
