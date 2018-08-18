const Eth = require('ethjs');
const Web3 = require('web3');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'nbCbdzC6IG9CF6hmvAVQ';

(async function () {

  // read jSON
  // construct transaction data
  // submit transactions to contract

  let network = `local`;
  let TO_MINT_PATH = `./scripts/tokenswap/${network}/to-mint.json`;

  let httpProviderUrl;
  if (network === 'local') {
    httpProviderUrl = `http://127.0.0.1:7545`;
  } else {
    httpProviderUrl = `https://${network}.infura.io/${infuraApikey}`;
  }

  // Connect to the contract
  let contract = new Eth(new Eth.HttpProvider(httpProviderUrl))
    .contract(require('../koda-abi/koda-v2-abi'))
    .at(getV2MarketplaceContractAddress(network));

  const fromAccount = new HDWalletProvider(require('../../mnemonic'), httpProviderUrl, 0).getAddress();
  console.log(fromAccount);

  const editionsToCreate = JSON.parse(fs.readFileSync(TO_MINT_PATH));

  let createdEditions = _.map(editionsToCreate,
    ({editionNumber, editionData, artistAccount, priceInWei, tokenURI, totalSupply, totalAvailable}) => {

      const editionType = 1;
      const artistCommission = 76;

      console.log(editionNumber, editionData, editionType, 0, 0, artistAccount, artistCommission, priceInWei, tokenURI, totalSupply, totalAvailable);

      return contract.createActivePreMintedEdition(
        editionNumber, editionData, editionType, 0, 0, artistAccount, artistCommission, priceInWei, tokenURI, totalSupply, totalAvailable
        , {
          from: fromAccount
        });
    });

  Promise.all(createdEditions)
    .then(() => {
      console.log("Populated");
    });

  function getV2MarketplaceContractAddress(network) {
    switch (network) {
      case 'mainnet':
        return '';
      case 'ropsten':
        return '';
      case 'rinkeby':
        return '';
      case 'local':
        // This may change if a clean deploy of KODA locally is not done
        return '0xb3d7dc586a6e2d20434ce1bc68b59eef77223e52';
      default:
        throw new Error(`Unknown network ID ${network}`);
    }
  }

})();
