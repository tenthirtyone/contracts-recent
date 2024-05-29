const ethers = require("ethers");
const { TypedDataUtils } = require("ethers-eip712");

const SIGNING_DOMAIN_NAME = "DcentralNFT-Voucher";
const SIGNING_DOMAIN_VERSION = "1";

/**
 * Class representing a LazyMinter for NFT vouchers.
 */
export class NFTLazyMinter {
  public contractAddress: string;
  public signer: any;
  public types: any;
  private _domain: any;

  /**
   * Creates an instance of LazyMinter.
   * @param {object} param - Parameters for LazyMinter.
   * @param {string} param.contractAddress - The contract address.
   * @param {any} param.signer - Signer for transactions.
   */
  constructor({ contractAddress, signer }) {
    this.contractAddress = contractAddress;
    this.signer = signer;

    this.types = {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      NFTVoucher: [
        { name: "tokenId", type: "uint256" },
        { name: "minPrice", type: "uint256" },
        { name: "recipient", type: "address" }, // Payment Recipient, NOT token recipient
      ],
    };
  }

  /**
   * Gets the signing domain for the contract.
   * @returns {Promise<object>} The domain object.
   */
  async _signingDomain() {
    if (this._domain != null) {
      return this._domain;
    }
    const chainId = await this.signer.getChainId();
    this._domain = {
      name: SIGNING_DOMAIN_NAME,
      version: SIGNING_DOMAIN_VERSION,
      verifyingContract: this.contractAddress,
      chainId,
    };
    return this._domain;
  }

  /**
   * Formats a voucher for signing.
   * @param {object} voucher - The voucher to format.
   * @returns {Promise<object>} The formatted voucher.
   */
  async _formatVoucher(voucher) {
    const domain = await this._signingDomain();
    return {
      domain,
      types: this.types,
      primaryType: "NFTVoucher",
      message: voucher,
    };
  }

  /**
   * Creates a signed voucher.
   * @param {number} tokenId - The token ID.
   * @param {number} [minPrice=0] - Minimum price for the NFT.
   * @param {string} recipient - Recipient address.
   * @returns {Promise<object>} An object containing the voucher, signature, and digest.
   */
  async createVoucher(tokenId, minPrice = 0, recipient) {
    const voucher = { tokenId, minPrice, recipient };
    const typedData = await this._formatVoucher(voucher);
    const digest = TypedDataUtils.encodeDigest(typedData);
    const signature = await this.signer.signMessage(digest);
    return {
      voucher,
      signature,
      digest,
    };
  }
}

export default NFTLazyMinter;
