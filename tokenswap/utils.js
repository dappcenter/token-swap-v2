function getV2Marketplace(network) {
    switch (network) {
        case 'mainnet':
            return '';
        case 'ropsten':
            return '';
        case 'rinkeby':
            return '';
        case 'local':
            // This may change if a clean deploy of KODA locally is not done
            return '0xb8832ab2af8eebeb04d943e12fc5478e3c230b13';
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
