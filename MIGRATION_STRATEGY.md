# The Strategy

#### Prerequisites

* V2 contracts are deployed to the network you are migrating i.e. local, ropsten, rinkeby, mainnet
* When running locally, a fresh deployment has been done i.e. `clean_deploy_local.sh` inside the default KO marketplace project

#### Migration Steps

1) Download V2 contracts - make sure you have the latest versions
    - place both `KnownOriginDigitalAssets.json` & `KnownOriginDigitalAssetsV2.json` in `/build/contracts/`
    - this is so truffle can correct 

2) Run script `node tokenswap/generate-editon-mappings.js`, this will: 
    - Create a `tokenswap/data/edition-mappings.json` file which maps old editions to new edition numbers
    - Run against mainnet

3) Copy the output from your console and place into the `TokenSwap.sol` contact constructor
    - This allows for any tokens to be swapped in at a later date by providing a bridge from V1 to V2,
     absorbing on token and issuing the equivalent from V2.

4) Run the following script `node tokenswap/build-tokenswap.js`, this will:
    - Create a file, based on the network you are pointing at 
    - Each file will contain the necessary data required to build a editions suitable to be migrated into V2
    - See file `data/${network}/migration-data.json` for proposed editions to migration
    - Methods V2 `underMint(address _to, uint256 _editionNumber)` & `tokenSwap(uint256 _oldTokenId)` in `TokenSwap`
    - Suitability is defined by .... TODO
    
5) Populate the network by running the following script
    - `node tokenswap/`
