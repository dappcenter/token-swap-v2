const Eth = require('ethjs');
const Web3 = require('web3');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');

(async function () {
  // query main contract
  // query for each asset
  // download data
  // download IPFS data
  // build token swap per edition

  let network = `local`;
  let RAW_PATH = `./scripts/tokenswap/${network}/data.json`;
  let PROCESSED_PATH = `./scripts/tokenswap/${network}/processed.json`;
  let TO_MINT_PATH = `./scripts/tokenswap/${network}/to-mint.json`;
  let UNSOLD_MINT_PATH = `./scripts/tokenswap/${network}/unsold-edition.json`;

  let httpProvider;
  if (network === 'local') {
    httpProvider = new Eth.HttpProvider(`HTTP://127.0.0.1:7545`);
  } else {
    httpProvider = new Eth.HttpProvider(`https://${network}.infura.io/nbCbdzC6IG9CF6hmvAVQ`);
  }

  // Connect to the contract
  let contract = new Eth(httpProvider)
    .contract(require('./koda-abi'))
    .at(getMarketplaceContractAddress(network));

  let tokenIdPointer = await contract.tokenIdPointer();
  console.log(`Token pointer at [${tokenIdPointer[0]}]`);

  let supply = _.range(0, tokenIdPointer[0]);

  const allData = [];

  let promises = _.map(supply, async (tokenId) => {

    let exists = await contract.exists(tokenId);
    console.log(`exists [${exists[0]}] tokenId [${tokenId}]`);

    if (exists[0]) {
      return Promise.props({
        assetInfo: assetInfo(contract, tokenId),
        editionInfo: editionInfo(contract, tokenId)
      })
        .then(({assetInfo, editionInfo}) => {
          // console.log(assetInfo, editionInfo);
          allData.push({
            ...assetInfo,
            ...editionInfo,
          });
        });
    }
  });

  Promise.all(promises).then(() => {
    return fs.writeFileSync(RAW_PATH, JSON.stringify(_.orderBy(allData, 'tokenId'), null, 4));
  })
    .then(() => {

      const editionsToMigrate = {};

      _.forEach(allData, (data) => {

        let type = data.edition.substring(13, 16);

        // Skip physical for now
        let isNotPhysical = type !== 'PHY';

        if (isNotPhysical) {

          if (!editionsToMigrate[data.edition]) {
            editionsToMigrate[data.edition] = {
              editionData: data.edition,
              rawEdition: data.rawEdition,
              editionType: 1,
              auctionStartDate: 0,
              auctionEndDate: 0,
              artistAccount: data.artistAccount, // TODO lookup artists account from JSON data
              artistCommission: 76,
              priceInWei: data.priceInWei,
              tokenURI: data.tokenURI.replace('https://ipfs.infura.io/ipfs/', ''),
              type: type,
              totalSupply: 0,
              totalAvailable: 0,
              active: true,
              tokenIds: [],
              purchasedTokens: [],
              unsoldTokens: []
            };
          }

          let tokenAlreadyHandled = _.find(editionsToMigrate[data.edition].tokenIds, data.tokenId);
          if (!tokenAlreadyHandled) {
            editionsToMigrate[data.edition].totalAvailable++;

            if (isPurchased(data)) {
              editionsToMigrate[data.edition].totalSupply++;
              editionsToMigrate[data.edition].purchasedTokens.push(data.tokenId);
            } else {
              editionsToMigrate[data.edition].unsoldTokens.push(data.tokenId);
            }

            editionsToMigrate[data.edition].tokenIds.push(data.tokenId);
          }

        }
      });

      fs.writeFileSync(PROCESSED_PATH, JSON.stringify(editionsToMigrate, null, 4));

      const newEditionsToMint = [];
      const unsoldEditionsToMint = [];

      let migrationEditionCounter = 100;

      _.forEach(editionsToMigrate, (data, edition) => {
        if (data.totalSupply !== data.totalAvailable) {
          data.editionNumber = migrationEditionCounter;
          console.log(`oldToNewEditionMappings[${data.rawEdition}] = ${migrationEditionCounter}; // ${edition}`);
          migrationEditionCounter = migrationEditionCounter + 100;
          newEditionsToMint.push(data);
        }
        if (data.tokenIds.length === data.unsoldTokens.length) {
          unsoldEditionsToMint.push(data);
        }
      });

      fs.writeFileSync(TO_MINT_PATH, JSON.stringify(newEditionsToMint, null, 4));

      fs.writeFileSync(UNSOLD_MINT_PATH, JSON.stringify(unsoldEditionsToMint, null, 4));


    });

  function isPurchased({owner}) {
    if (network === 'local') {
      return owner !== '0x0df0cc6576ed17ba870d6fc271e20601e3ee176e';
    }
    return owner !== '0x3f8c962eb167ad2f80c72b5f933511ccdf0719d4';
  }

  function assetInfo(contract, tokenId) {
    return contract.assetInfo(tokenId)
      .then((data) => {
        const priceInWei = data._priceInWei.toString(10);
        return {
          tokenId,
          owner: data._owner,
          purchaseState: data._purchaseState.toNumber(),
          priceInWei: priceInWei,
          priceInEther: Web3.utils.fromWei(priceInWei, 'ether').valueOf(),
          purchaseFromTime: data._purchaseFromTime.toString(10)
        };
      }).catch((e) => console.log(e));
  }

  function editionInfo(contract, tokenId) {
    return contract.editionInfo(tokenId)
      .then((data) => {
        let edition = Web3.utils.toAscii(data._edition);
        return {
          tokenId,
          edition,
          rawEdition: data._edition,
          editionNumber: data._editionNumber.toNumber(),
          tokenURI: data._tokenURI.toString(),
          artistAccount: data._artistAccount
        };
      }).catch((e) => console.log(e));
  }

  function getMarketplaceContractAddress(network) {
    switch (network) {
      case 'mainnet':
        return '0xdde2d979e8d39bb8416eafcfc1758f3cab2c9c72';
      case 'ropsten':
        return '0x986933d91344c7b4f98c747f8a7c98f0ce27cee2';
      case 'rinkeby':
        return '0xf0d6a41a3f011e06260f9133101b82b405539167';
      case 'local':
        // This may change if a clean deploy of KODA locally is not done
        return '0x194bafbf8eb2096e63c5d9296363d6dacdb32527';
      default:
        throw new Error(`Unknown network ID ${network}`);
    }
  }

})();
