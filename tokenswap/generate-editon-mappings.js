const Eth = require('ethjs');
const Web3 = require('web3');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');
const {getV1Marketplace} = require('./utils');

const EDITION_MAPPINGS_PATH = `./tokenswap/data/edition-mappings.json`;

const infuraApikey = 'nbCbdzC6IG9CF6hmvAVQ';

(async function () {
    const network = 'local';

    async function populateData() {
        const contract = await connectToKodaV1Contract(network);

        const tokenIdPointer = await contract.tokenIdPointer();
        console.log(`Token pointer at [${tokenIdPointer[0]}]`);

        const supply = _.range(0, tokenIdPointer[0]);

        const allData = [];

        const promises = _.map(supply, async (tokenId) => {
            let exists = await contract.exists(tokenId);
            console.log(`exists [${exists[0]}] tokenId [${tokenId}]`);
            if (exists[0]) {
                return editionInfo(contract, tokenId)
                    .then((result) => {
                        allData.push(result);
                    });
            }
        });

        await Promise.all(promises);

        let migrationEditionCounter = 100;

        const editionsMappings = {};

        _.forEach(_.orderBy(allData, 'tokenId'), (data) => {
            if (!editionsMappings[data.edition]) {
                migrationEditionCounter = migrationEditionCounter + 100;
                console.log(`oldToNewEditionMappings[${data.rawEdition}] = ${migrationEditionCounter}; // ${data.edition}`);
                editionsMappings[data.edition] = migrationEditionCounter;
            }
        });

        fs.writeFileSync(EDITION_MAPPINGS_PATH, JSON.stringify(editionsMappings, null, 4));
    }

    await populateData();
})();

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

function connectToKodaV1Contract(network) {
    let httpProvider;
    if (network === 'local') {
        httpProvider = new Eth.HttpProvider(`HTTP://127.0.0.1:7545`);
    } else {
        httpProvider = new Eth.HttpProvider(`https://${network}.infura.io/nbCbdzC6IG9CF6hmvAVQ`);
    }

    // Connect to the contract
    return new Eth(httpProvider)
        .contract(require('../koda-abi/koda-v1-abi'))
        .at(getV1Marketplace(network));
}
