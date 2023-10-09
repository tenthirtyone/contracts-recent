require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@typechain/hardhat");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  networks: {
    zkEVMtestnet: {
      url: `https://rpc.public.zkevm-test.net`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/l5r4TH0qpjY-OeNvsEE4jGe3Sbluf53O`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: "TRZG89K55S9UWJC9PD2FHWTV3AWNV1CYU7",
      zkEVMtestnet: "6TDA4H3KU36XVSUYI481162XTZG9ZYF7WR",
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
    ],
  },
};
