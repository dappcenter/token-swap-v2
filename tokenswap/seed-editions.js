const Eth = require('ethjs');
const Web3 = require('web3');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');
const {getV2Marketplace} = require('./utils');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'nbCbdzC6IG9CF6hmvAVQ';

(async function () {

    let network = `local`;

    let MIGRATION_PATH_PATH = `./tokenswap/data/${network}/migration-data.json`;

    let httpProviderUrl = getHttpProviderUri(network);
    console.log("httpProviderUrl");

    let contract = connectToKodaV2Contract(network);
    console.log("contract");

    const fromAccount = new HDWalletProvider(require('../mnemonic'), httpProviderUrl, 0).getAddress();
    console.log("fromAccount");

    const editionsToCreate = JSON.parse(fs.readFileSync(MIGRATION_PATH_PATH));

    let createdEditions = _.map(editionsToCreate, ({data, defaults, processed}) => {

        const {editionType, auctionStartDate, auctionEndDate, artistCommission, active} = defaults;

        const {newEditionNumber, totalSupply, totalAvailable, tokenURI} = processed;

        const {owner, priceInWei, rawEdition, artistAccount, edition} = data;

        // TODO pad edition to 32 bytes

        console.log(newEditionNumber, edition, editionType, auctionStartDate, auctionEndDate, artistAccount, artistCommission, priceInWei, tokenURI, totalSupply, totalAvailable);

        return contract.createActivePreMintedEdition(newEditionNumber, edition, editionType, auctionStartDate, auctionEndDate, artistAccount, artistCommission, priceInWei, tokenURI, totalSupply, totalAvailable, {
            from: fromAccount
        });
    });

    await Promise.all(createdEditions);

    console.log("Populated");

    function connectToKodaV2Contract(network) {
        return new Eth(new Eth.HttpProvider(getHttpProviderUri(network)))
            .contract(require('../koda-abi/koda-v2-abi'))
            .at(getV2Marketplace(network));
    }

    function getHttpProviderUri(network) {
        if (network === 'local') {
            return 'HTTP://127.0.0.1:7545';
        }
        return `https://${network}.infura.io/${infuraApikey}`;
    }

})();
