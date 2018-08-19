# The Strategy

* Details on how to migrate from V1 to V2.

#### Prerequisites

* V2 contracts are deployed to the network you are migrating i.e. local, ropsten, rinkeby, mainnet
* When running locally, a fresh deployment has been done i.e. `clean_deploy_local.sh` inside the default KO marketplace project
* Run script `node tokenswap/generate-editon-mappings.js`, this will
    - Create a `tokenswap/data/edition-mappings.json` file which maps old editions to new edition numbers
    - Runs against local
    - DO NOT DO THIS STEP IF 
        - The data is already partially migrated
            - The reason for this is that this is the master mapping file between old & new world 
            editions and needs to be maintained per network, so all networks mush use the same mapping file for consistency.

#### Migration Steps

1) Download V2 contracts - make sure you have the latest versions
    - place both `KnownOriginDigitalAssets.json` & `KnownOriginDigitalAssetsV2.json` in `/build/contracts/`
    - this is so truffle can correctly access them

2) Copy the output from your console and place into the `TokenSwap.sol` contact constructor
    - This allows for any tokens to be swapped in at a later date by providing a bridge from V1 to V2,
     absorbing one token and issuing the equivalent from V2.

3) Run the following script `node tokenswap/build-tokenswap.js`, this will:
    - Create a file, based on the network you are pointing at 
    - Each file will contain the necessary data required to build a editions suitable to be migrated into V2
    - See file `data/${network}/migration-data.json` for proposed editions to migration
    - Methods V2 `underMint(address _to, uint256 _editionNumber)` & `tokenSwap(uint256 _oldTokenId)` in `TokenSwap`
    
4) Populate the network by running the following script `node tokenswap/seed-editions.js`
    - This will look at the data within `migration-data.json` and construct a ethereum transaction based on the data
    - Each transaction is then submitted to the network for population
