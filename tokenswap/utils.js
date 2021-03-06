function getV2Marketplace(network) {
    switch (network) {
        case 'mainnet':
            return '0xfbeef911dc5821886e1dda71586d90ed28174b7d';
        case 'ropsten':
            return '0x29a3f97e9ac395e2e1bfa789bbbbb5468e6022af';
        case 'rinkeby':
            return '0x2df6816286c583a7ef8637cd4b7cc1cc62f6161e';
        case 'local':
            // This may change if a clean deploy of KODA locally is not done
            return '0xd2e4993006202caf64f9c8ce46aec9a50d3cda54';
        default:
            throw new Error(`Unknown network ID ${network}`);
    }
}

function getV1Marketplace(network) {
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

module.exports = {
    getV2Marketplace,
    getV1Marketplace,
};
