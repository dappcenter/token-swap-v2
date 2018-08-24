const Eth = require('ethjs');
const Web3 = require('web3');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');

const {getV1Marketplace} = require('./utils');

const EDITION_MAPPINGS = require(`./data/edition-mappings`);

(async function () {

    ////////////////////////////////
    // The network to run against //
    ////////////////////////////////

    const program = require('commander');

    program
        .option('-n, --network <n>', 'Network - either mainnet,ropsten,rinkeby,local')
        .parse(process.argv);

    if (!program.network) {
        console.log(`Please specify -n mainnet,ropsten,rinkeby or local`);
        process.exit();
    }

    const network = program.network;

    ////////////////////////////////
    // The network to run against //
    ////////////////////////////////

    const RAW_PATH = `./tokenswap/data/${network}/raw-data.json`;
    const MIGRATION_DATA_PATH = `./tokenswap/data/${network}/migration-data.json`;

    const contract = connectToKodaV1Contract(network);

    const allData = await populateTokenData(contract);

    const editionsToMigrate = {};

    _.forEach(allData, (data) => {

        let type = data.edition.substring(13, 16);

        // Skip physical for now
        let isPhysical = type === 'PHY';
        if (!isPhysical) {

            let {edition, tokenId, owner} = data;
            console.log(`Processing - edition=[${edition}], tokenId=[${tokenId}], owner=[${owner}]`);

            // Drop token specific fields from data to avoid confusion
            delete data.tokenId;
            delete data.owner;
            delete data.purchaseState;

            if (!editionsToMigrate[data.edition]) {
                editionsToMigrate[data.edition] = {
                    data: {
                        ...data
                    },
                    defaults: {
                        editionType: 1,
                        auctionStartDate: 0,
                        auctionEndDate: 0,
                        artistCommission: 76,
                        active: true,
                    },
                    processed: {
                        totalSupply: 0,
                        totalAvailable: 0,
                        newEditionNumber: data.newEditionNumber, // newly converted edition number
                        tokenURI: data.tokenURI.replace('https://ipfs.infura.io/ipfs/', ''),
                        tokenIds: [],
                        purchasedTokens: [],
                        unsoldTokens: []
                    },
                };
            }

            let tokenAlreadyHandled = _.find(editionsToMigrate[edition].processed.tokenIds, tokenId);
            if (!tokenAlreadyHandled) {
                editionsToMigrate[edition].processed.totalAvailable++;

                if (isPurchased(owner)) {
                    editionsToMigrate[edition].processed.totalSupply++;
                    editionsToMigrate[edition].processed.purchasedTokens.push(tokenId);
                } else {
                    editionsToMigrate[edition].processed.unsoldTokens.push(tokenId);
                }

                editionsToMigrate[edition].processed.tokenIds.push(tokenId);
            }

        }
    });

    console.log(`Filtering editions`);

    const newEditionsToMint = [];
    const unsoldEditionsToMint = [];

    _.forEach(editionsToMigrate, (data, editionKey) => {

        let {totalAvailable, totalSupply, unsoldTokens, tokenIds} = data.processed;
        let {artistAccount} = data.data;

        if (totalSupply !== totalAvailable && artistsWithValidAccount(artistAccount)) {
            newEditionsToMint.push(data);
        }
        if (tokenIds.length === unsoldTokens.length) {
            unsoldEditionsToMint.push(data);
        }
    });

    console.log(`
    Report:
        - Editions processed: ${_.keys(editionsToMigrate).length}
        - Editions to mint: ${newEditionsToMint.length} (not physical, not 100% sold out, artist has a valid eth address)
        - Editions without any sales: ${unsoldEditionsToMint.length} (editions with no purchases yet)
    `);

    fs.writeFileSync(MIGRATION_DATA_PATH, JSON.stringify(_.orderBy(newEditionsToMint, 'data.newEditionNumber'), null, 4));

    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////

    function isPurchased(owner) {
        if (network === 'local' || network === 'ropsten' || network === 'rinkeby') {
            return owner !== '0x0df0cc6576ed17ba870d6fc271e20601e3ee176e';
        }
        return owner !== '0x3f8c962eb167ad2f80c72b5f933511ccdf0719d4';
    }

    function artistsWithValidAccount(artistAccount) {
        // check that artists account not one of ours, i.e. a fall back account from V1
        return [
            "0x0f35cba9cbdf6982d65c485ee9958937c11b59a9",
            "0x0df0cc6576ed17ba870d6fc271e20601e3ee176e"
        ].indexOf(_.toLower(artistAccount)) < 0;
    }

    async function populateTokenData(contract) {

        let tokenIdPointer = await contract.tokenIdPointer();
        console.log(`Token pointer at [${tokenIdPointer[0]}]`);

        let supply = _.range(0, tokenIdPointer[0]);

        const allData = [];

        let promises = _.map(supply, async (tokenId) => {

            let exists = await contract.exists(tokenId);
            console.log(`exists [${exists[0]}] tokenId [${tokenId}]`);

            if (exists[0]) {

                const {assetInfo, editionInfo} = await Promise.props({
                    assetInfo: lookupAssetInfo(contract, tokenId),
                    editionInfo: lookupEditionInfo(contract, tokenId)
                });

                // console.log(assetInfo, editionInfo);
                allData.push({
                    ...assetInfo,
                    ...editionInfo,
                });
            }
        });

        return Promise.all(promises)
            .then(() => {
                console.log(`Witting raw data - ${allData.length} tokens`);
                fs.writeFileSync(RAW_PATH, JSON.stringify(_.orderBy(allData, 'tokenId'), null, 4));
                return allData;
            });
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

    function lookupAssetInfo(contract, tokenId) {
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

    function lookupEditionInfo(contract, tokenId) {
        return contract.editionInfo(tokenId)
            .then((data) => {
                let edition = Web3.utils.toAscii(data._edition);
                return {
                    tokenId,
                    edition,

                    rawEdition: data._edition,
                    editionNumber: data._editionNumber.toNumber(),
                    // Decorate the new edition number
                    newEditionNumber: EDITION_MAPPINGS[edition],
                    tokenURI: data._tokenURI.toString(),
                    artistAccount: data._artistAccount
                };
            }).catch((e) => console.log(e));
    }

})();
