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
    base: {
      url: "https://base-mainnet.g.alchemy.com/v2/0zO0tPCgo9aHdQKFu7MDFTWxmFmGZAn2",
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    optimism: {
      url: "https://opt-mainnet.g.alchemy.com/v2/bNRK5mcwaWOMTHfjcGzKUJub-Ip8V6gv",
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    arbitrum: {
      url: "https://arb-mainnet.g.alchemy.com/v2/Z3vcyBCUhEl3DFLYXCWPbBpKsziy3B0w",
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    amoy: {
      url: "https://polygon-amoy.g.alchemy.com/v2/a6Zd8BNblZs0BVB16vtxargBwfrNCZtw",
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
  },
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
