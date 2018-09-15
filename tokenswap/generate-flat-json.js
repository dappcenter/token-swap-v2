const _ = require('lodash');
const fs = require('fs');

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

    const MIGRATION_PATH_PATH = `./tokenswap/data/${network}/migration-data.json`;
    const TOKEN_MIGRATION_PATH_PATH = `./tokenswap/data/${network}/data.json`;

    const editionsToCreate = JSON.parse(fs.readFileSync(MIGRATION_PATH_PATH));

    let createdEditions = _.map(editionsToCreate, ({data, defaults, processed}) => {

        const {editionType, auctionStartDate, auctionEndDate, artistCommission} = defaults;

        const {newEditionNumber, totalSupply, totalAvailable, tokenURI} = processed;

        const {priceInWei, rawEdition, artistAccount, edition} = data;

        console.log(newEditionNumber, edition, editionType, auctionStartDate, auctionEndDate, artistAccount, artistCommission, priceInWei, tokenURI, totalSupply, totalAvailable);

        return {
            editionNumber: newEditionNumber,
            editionData: edition,
            editionType: editionType,
            priceInWei: priceInWei,
            startDate: auctionStartDate,
            endDate: auctionEndDate,
            artistCommission: artistCommission,
            totalAvailable: totalAvailable,
            artistAccount: artistAccount,
            tokenURI: tokenURI,
        }
    });

    fs.writeFileSync(TOKEN_MIGRATION_PATH_PATH, JSON.stringify(createdEditions, null, 4));

})();
