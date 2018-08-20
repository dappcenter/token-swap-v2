const assertRevert = require('./helpers/assertRevert');
const etherToWei = require('./helpers/etherToWei');

const advanceBlock = require('./helpers/advanceToBlock');

const _ = require('lodash');

const BigNumber = web3.BigNumber;

const KnownOriginDigitalAsset = artifacts.require('KnownOriginDigitalAsset');
const KnownOriginDigitalAssetV2 = artifacts.require('KnownOriginDigitalAssetV2');
const TokenSwap = artifacts.require('KnownOriginV1TokenSwap');

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('V1 to V2 TokenSwap', function (accounts) {
    const _owner = accounts[0];

    const account1 = accounts[1];
    const account2 = accounts[2];
    const account3 = accounts[4];
    const account4 = accounts[4];

    const achieveAddress = accounts[6];

    const artistAccount = accounts[8];
    const artistCommission = 76;

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    before(async function () {
        // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock();
    });

    beforeEach(async function () {
        this.kodaV2 = await KnownOriginDigitalAssetV2.new({from: _owner});
        this.kodaV1 = await KnownOriginDigitalAsset.new(account1, {from: _owner});
        this.tokenSwap = await TokenSwap.new(this.kodaV1.address, this.kodaV2.address, achieveAddress, {from: _owner});

        // Ensure TokenSwap is added to white lsit spo it can mint
        await this.kodaV2.addAddressToWhitelist(this.tokenSwap.address);

        // console.log(`V1 address = [${this.kodaV1.address}]`);
        // console.log(`V2 address = [${this.kodaV2.address}]`);
        // console.log(`TokenSwap address = [${this.tokenSwap.address}]`);
    });

    describe('constructor checks', async function () {
        it('should fail if missing kodaV1 address', async function () {
            await assertRevert(TokenSwap.new(ZERO_ADDRESS, this.kodaV2.address, achieveAddress, {from: _owner}));
        });

        it('should fail if missing kodaV2 address', async function () {
            await assertRevert(TokenSwap.new(this.kodaV1.address, ZERO_ADDRESS, achieveAddress, {from: _owner}));
        });

        it('should fail if missing achieve address', async function () {
            await assertRevert(TokenSwap.new(this.kodaV1.address, this.kodaV2.address, ZERO_ADDRESS, {from: _owner}));
        });
    });

    describe('validation token swap from V1 to V2', async function () {

        it('should fail if token does not exists', async function () {
            const invalidTokenId = 99999;
            await assertRevert(this.tokenSwap.tokenSwap(invalidTokenId));
        });

        describe('token is valid but does not match edition', async function () {
            const unknownEdition = "123ABC0000000DIG";
            const tokenIdMinted = 0;

            beforeEach(async function () {
                await this.kodaV1.mint("", unknownEdition, 0, 0, artistAccount, {
                    from: _owner
                });

                await this.kodaV1.setApprovalForAll(this.tokenSwap.address, true, {from: _owner});

                let approved = await this.tokenSwap.isApprovedForTransfer(tokenIdMinted);
                approved.should.be.equal(true);
            });

            it('should fail if does not match edition from V2', async function () {
                await assertRevert(this.tokenSwap.tokenSwap(tokenIdMinted));
            });
        });

        describe('token is valid and matches but not contract not approved for the move', async function () {
            const edition = "FKAMARTIANBNGDIG";
            const tokenIdMinted = 0;

            const editionType = 1;
            const editionNumber = 4900;
            const editionData = "editionData";
            const editionTokenUri = "editionUri";
            const price = etherToWei(0.1);

            beforeEach(async function () {
                await this.kodaV1.mint("", edition, 0, 0, artistAccount, {from: _owner});
                await this.kodaV2.createActiveEdition(editionNumber, editionData, editionType, 0, 0, artistAccount, artistCommission, price, editionTokenUri, 4, {from: _owner});
            });

            it('should fail if editions match but token swap not approved', async function () {
                let approved = await this.tokenSwap.isApprovedForTransfer(tokenIdMinted);
                approved.should.be.equal(false);

                let editionMapping = await this.tokenSwap.editionMapping(tokenIdMinted);
                editionMapping.should.be.bignumber.equal(editionNumber);

                await assertRevert(this.tokenSwap.tokenSwap(tokenIdMinted));

                await this.kodaV1.setApprovalForAll(this.tokenSwap.address, true, {from: _owner});

                approved = await this.tokenSwap.isApprovedForTransfer(tokenIdMinted);
                approved.should.be.equal(true);

                let {logs} = await this.tokenSwap.tokenSwap(tokenIdMinted);
                logs.length.should.be.equal(1);

                let TokenSwappedEvent = logs[0];
                TokenSwappedEvent.event.should.be.equal('TokenSwapped');
                let {_oldTokenId, _newTokenId, _oldEdition, _newEditionNumber} = TokenSwappedEvent.args;

                _oldTokenId.should.be.bignumber.equal(tokenIdMinted);
                _newTokenId.should.be.bignumber.equal(editionNumber + 1);
                web3.toAscii(_oldEdition).replace(/\0/g, '').should.be.equal(edition);
                _newEditionNumber.should.be.bignumber.equal(editionNumber);
            });
        });

    });

    describe('token swap from V1 to V2', function () {

        const edition = "FKAMARTIANBNGDIG";
        const editionType = 1;
        const editionNumber = 4900;
        const editionData = "editionData";
        const editionTokenUri = "editionUri";
        const price = etherToWei(0.1);
        const minted = 2;
        const available = 4;

        // Two tokens from initial V1 mint
        const originalFirstV1TokenId = 0;
        const originalSecondV1TokenId = 1;

        // The same two token Ids from the token swap
        const firstTokenSwapId = editionNumber + 1; // 6801
        const secondTokenSwapId = editionNumber + 2; // 6802

        // The last two tokens which are minted from V2
        const thirdNewlyMintedV2Token = editionNumber + 3; // 6803
        const fourthNewlyMintedV2Token = editionNumber + 4;  // 6804

        beforeEach(async function () {
            // Mint 2 from the old one that we can
            await this.kodaV1.mint("", edition, 0, 0, artistAccount, {from: _owner}); // 1st minted of V1
            await this.kodaV1.mint("", edition, 0, 0, artistAccount, {from: _owner}); // 2nd minted of V1

            // Purchase the two V1 tokens
            await this.kodaV1.purchaseWithEther(originalFirstV1TokenId, {from: account2, value: price});
            await this.kodaV1.purchaseWithEther(originalSecondV1TokenId, {from: account2, value: price});

            // Create under mint edition i.e. minted = 2, available = 4 - 2 more to be available as part of V2
            await this.kodaV2.createActivePreMintedEdition(editionNumber, editionData, editionType, 0, 0, artistAccount, artistCommission, price, editionTokenUri, minted, available, {from: _owner});

            // Ensure token swap is white listed as a minter
            await this.kodaV1.setApprovalForAll(this.tokenSwap.address, true, {from: account2});
        });

        it('account 2 should own both existing v1 tokens', async function () {
            let firstTokenOwner = await this.kodaV1.ownerOf(originalFirstV1TokenId);
            firstTokenOwner.should.be.equal(account2);

            let secondTokenOwner = await this.kodaV1.ownerOf(originalSecondV1TokenId);
            secondTokenOwner.should.be.equal(account2);
        });

        it('should under mint new tokens', async function () {
            // Check only 2 tokens available to token swap
            let totalSupply = await this.kodaV1.totalSupply();
            totalSupply.should.be.bignumber.equal(2);

            await checkTotalRemaining.call(this, editionNumber, 2, 2);

            // Token swap the 2 tokens
            await swapTokenAndCheckOwnership.call(this, originalFirstV1TokenId, account2, firstTokenSwapId, editionNumber, edition);
            await swapTokenAndCheckOwnership.call(this, originalSecondV1TokenId, account2, secondTokenSwapId, editionNumber, edition);
            await checkTotalRemaining.call(this, editionNumber, 2, 2);

            await mintNewTokenAndValidate.call(this, editionNumber, account3, price, thirdNewlyMintedV2Token);
            await checkTotalRemaining.call(this, editionNumber, 1, 3);

            await mintNewTokenAndValidate.call(this, editionNumber, account4, price, fourthNewlyMintedV2Token);
            await checkTotalRemaining.call(this, editionNumber, 0, 4);

            // Confirm no more tokens left to mint
            await assertRevert(this.kodaV2.purchase(editionNumber, {from: account4, value: price}));
        });

        const mintNewTokenAndValidate = async function (editionNumber, purchaser, price, newTokenId) {
            await assertRevert(this.kodaV2.ownerOf(newTokenId));

            await this.kodaV2.purchase(editionNumber, {from: purchaser, value: price});

            let ownerOf = await this.kodaV2.ownerOf(newTokenId);
            ownerOf.should.be.equal(purchaser);
        };

        const checkTotalRemaining = async function (editionNumber, expectedRemaining, expectedMinted) {
            let totalRemaining = await this.kodaV2.totalRemaining(editionNumber);
            totalRemaining.should.be.bignumber.equal(expectedRemaining);

            let editionTotalSupply = await this.kodaV2.editionTotalSupply(editionNumber);
            editionTotalSupply.should.be.bignumber.equal(expectedMinted);
        };

        const swapTokenAndCheckOwnership = async function (originalTokenId, originalOwner, newTokenId, newEditionNumber, oldEdition) {
            let originalTokenOwner = await this.kodaV1.ownerOf(originalTokenId);
            originalTokenOwner.should.be.equal(account2);

            // Token Swap
            let {logs} = await this.tokenSwap.tokenSwap(originalTokenId);
            logs.length.should.be.equal(1);

            let TokenSwappedEvent = logs[0];
            TokenSwappedEvent.event.should.be.equal('TokenSwapped');
            let {_oldTokenId, _newTokenId, _oldEdition, _newEditionNumber} = TokenSwappedEvent.args;

            _oldTokenId.should.be.bignumber.equal(originalTokenId);
            _newTokenId.should.be.bignumber.equal(newTokenId);
            web3.toAscii(_oldEdition).replace(/\0/g, '').should.be.equal(oldEdition);
            _newEditionNumber.should.be.bignumber.equal(newEditionNumber);

            // Check new owner has change to achieve address
            let newOwnerToken1 = await this.kodaV1.ownerOf(originalTokenId);
            newOwnerToken1.should.be.equal(achieveAddress);

            // Check newly swapped token from V2 exists and is now owned by same account as original
            let firstTokenOwner = await this.kodaV2.ownerOf(newTokenId);
            firstTokenOwner.should.be.equal(originalOwner);
        };

    });

});
