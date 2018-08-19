const Eth = require('ethjs');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');
const {getV2Marketplace} = require('./utils');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'nbCbdzC6IG9CF6hmvAVQ';

(async function () {

    const network = `local`;

    const {gas, gasPrice} = _.get(require('../truffle'), `networks.${network}`, {gas: 4075039, gasPrice: 35000000000});
    console.log(`gas=${gas} | gasPrice=${gasPrice}`);

    const MIGRATION_PATH_PATH = `./tokenswap/data/${network}/migration-data.json`;

    const httpProviderUrl = getHttpProviderUri(network);
    console.log("httpProviderUrl");

    const contract = connectToKodaV2Contract(network);
    console.log("contract");

    const fromAccount = new HDWalletProvider(require('../mnemonic'), httpProviderUrl, 0).getAddress();
    console.log("fromAccount");

    let nonce = await getAccountNonce(network, fromAccount);

    const editionsToCreate = JSON.parse(fs.readFileSync(MIGRATION_PATH_PATH));

    let successes = [];
    let failures = [];

    let createdEditions = _.map(editionsToCreate, ({data, defaults, processed}) => {

        const {editionType, auctionStartDate, auctionEndDate, artistCommission} = defaults;

        const {newEditionNumber, totalSupply, totalAvailable, tokenURI} = processed;

        const {priceInWei, rawEdition, artistAccount, edition} = data;

        console.log(newEditionNumber, edition, editionType, auctionStartDate, auctionEndDate, artistAccount, artistCommission, priceInWei, tokenURI, totalSupply, totalAvailable);

        let result = contract.createActivePreMintedEdition(
            newEditionNumber,
            rawEdition,
            editionType,
            auctionStartDate,
            auctionEndDate,
            artistAccount,
            artistCommission,
            priceInWei,
            tokenURI,
            totalSupply,
            totalAvailable,
            {
                from: fromAccount,
                nonce: nonce,
                gas: gas,
                gasPrice: gasPrice
            })
            .then((success) => {
                successes.push(success);
                return success;
            })
            .catch((e) => {
                failures.push({
                    data,
                    error: e
                });
                return e;
            });

        // Bump nonce value
        nonce++;

        return result;
    });

    Promise.all(createdEditions)
        .then((rawTransactions) => {
            console.log(`
            Completed submitting transactions
            
                Report:
                    - Success [${successes.length}]
                    - Failures [${failures.length}]
                    - Attempts [${rawTransactions.length}]
            `);
            console.log(rawTransactions);
        });

})();

async function getAccountNonce(network, account) {
    return new Eth(new Eth.HttpProvider(getHttpProviderUri(network)))
        .getTransactionCount(account);
}

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
