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
      url: "https://arb-mainnet.g.alchemy.com/v2/j1Bxmby48eaIeX6duUjEaVQLIlDjbVYC",
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    amoy: {
      url: "https://polygon-amoy.g.alchemy.com/v2/a6Zd8BNblZs0BVB16vtxargBwfrNCZtw",
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
      amoy: "6TDA4H3KU36XVSUYI481162XTZG9ZYF7WR",
      polygonMumbai: "6TDA4H3KU36XVSUYI481162XTZG9ZYF7WR",
      arbitrumOne: "W6DHZTKTAXM11GIM81XM9N3XYVUGWY4JPV",
      optimisticEthereum: "P7A5U7JAXYAZVBNDU5U5CQYARWQ14BXA4Z",
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
