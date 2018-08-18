pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract KODAV1 {
  function editionOf(uint256 _tokenId) public view returns (bytes16 _edition);

  function ownerOf(uint256 _tokenId) public view returns (address);

  function exists(uint256 _tokenId) public view returns (bool);

  function isApprovedForAll(address _owner, address _operator) public view returns (bool);

  function transferFrom(address _from, address _to, uint256 _tokenId) public;
}

contract KODAV2 {
  function underMint(address _to, uint256 _editionNumber) public returns (uint256);

  function editionExists(uint256 _editionNumber) public returns (bool);
}

contract KnownOriginV1TokenSwap is Ownable {
  using SafeMath for uint;

  event TokenSwapped(uint256 _oldTokenId, uint256 _newTokenId, bytes32 _oldEdition, uint256 _newEditionNumber);

  KODAV1 public kodaV1;

  KODAV2 public kodaV2;

  address public archiveAddress;

  mapping(bytes16 => uint256) public oldToNewEditionMappings;

  /*
   * Constructor
   */
  constructor (
    KODAV1 _kodaV1,
    KODAV2 _kodaV2,
    address _archiveAddress
  ) public {
    require(_kodaV1 != address(0), "Missing KODA V1 address");
    require(_kodaV2 != address(0), "Missing KODA V2 address");
    require(_archiveAddress != address(0), "Missing KODA achieve address");

    archiveAddress = _archiveAddress;
    kodaV1 = _kodaV1;
    kodaV2 = _kodaV2;

    oldToNewEditionMappings[0x4a4f43464f5247524c424f5931444947] = 100; // JOCFORGRLBOY1DIG
    oldToNewEditionMappings[0x5044414c4e444d454844333030444947] = 200; // PDALNDMEHD300DIG
    oldToNewEditionMappings[0x5044414c4e444d454844323030444947] = 300; // PDALNDMEHD200DIG
    oldToNewEditionMappings[0x434e4a43494e4653544e473148504859] = 400; // CNJCINFSTNG1HPHY
    oldToNewEditionMappings[0x38394157414b45303030303031444947] = 500; // 89AWAKE000001DIG
    oldToNewEditionMappings[0x4a4f435041434f464c46303031444947] = 600; // JOCPACOFLF001DIG
    oldToNewEditionMappings[0x434e4a43494e4653544e473148444947] = 700; // CNJCINFSTNG1HDIG
    oldToNewEditionMappings[0x4b4f524d414e43484553544552444947] = 800; // KORMANCHESTERDIG
    oldToNewEditionMappings[0x3839414b555255534849303031444947] = 900; // 89AKURUSHI001DIG
    oldToNewEditionMappings[0x4d4e4f4e454f504c4130303031444947] = 1000; // MNONEOPLA0001DIG
    oldToNewEditionMappings[0x434e4a434f494e5a554b493030444947] = 1100; // CNJCOINZUKI00DIG
    oldToNewEditionMappings[0x4b4f524c454544533030303031444947] = 1200; // KORLEEDS00001DIG
    oldToNewEditionMappings[0x4c4556484f524e5342494e3231444947] = 1300; // LEVHORNSBIN21DIG
    oldToNewEditionMappings[0x414b505354454c4c4152303030444947] = 1400; // AKPSTELLAR000DIG
    oldToNewEditionMappings[0x53544a4841505059464f583030444947] = 1500; // STJHAPPYFOX00DIG
    oldToNewEditionMappings[0x445757444556494c52554e3030444947] = 1600; // DWWDEVILRUN00DIG
    oldToNewEditionMappings[0x4a4f4346414d54524545303031444947] = 1700; // JOCFAMTREE001DIG
    oldToNewEditionMappings[0x4c4556504947414c4f57303332444947] = 1800; // LEVPIGALOW032DIG
    oldToNewEditionMappings[0x484b54544845594c4956453030444947] = 1900; // HKTTHEYLIVE00DIG
    oldToNewEditionMappings[0x5354524d495241434c45303031444947] = 2000; // STRMIRACLE001DIG
    oldToNewEditionMappings[0x54534d44455052455353454430303031] = 2100; // TSMDEPRESSED0001
    oldToNewEditionMappings[0x414b5054454d504f3030303030444947] = 2200; // AKPTEMPO00000DIG
    oldToNewEditionMappings[0x4b4f524245524c494e30303031444947] = 2300; // KORBERLIN0001DIG
    oldToNewEditionMappings[0x4c4556484f524e534245453636444947] = 2400; // LEVHORNSBEE66DIG
    oldToNewEditionMappings[0x4c4f5353455230314152543033444947] = 2500; // LOSSER01ART03DIG
    oldToNewEditionMappings[0x4c48444249544f5049414e3031444947] = 2600; // LHDBITOPIAN01DIG
    oldToNewEditionMappings[0x4c455650554e4b494e43415244444947] = 2700; // LEVPUNKINCARDDIG
    oldToNewEditionMappings[0x4f425844444635303030303030444947] = 2800; // OBXDDF5000000DIG
    oldToNewEditionMappings[0x4c4f5353455230314152543032444947] = 2900; // LOSSER01ART02DIG
    oldToNewEditionMappings[0x505350475245454e3030303030444947] = 3000; // PSPGREEN00000DIG
    oldToNewEditionMappings[0x4f544b4e523431383030303030444947] = 3100; // OTKNR41800000DIG
    oldToNewEditionMappings[0x464b4148595044544853545930444947] = 3200; // FKAHYPDTHSTY0DIG
    oldToNewEditionMappings[0x4d4b4c5354594d4c4b4341504d443031] = 3300; // MKLSTYMLKCAPMD01
    oldToNewEditionMappings[0x4c455654524947414c4f573035444947] = 3400; // LEVTRIGALOW05DIG
    oldToNewEditionMappings[0x4c4844455448494e5349444531444947] = 3500; // LHDETHINSIDE1DIG
    oldToNewEditionMappings[0x4c484b50454550303030303031444947] = 3600; // LHKPEEP000001DIG
    oldToNewEditionMappings[0x50535052454430303030303030444947] = 3700; // PSPRED0000000DIG
    oldToNewEditionMappings[0x383941555026444f574e303031444947] = 3800; // 89AUP&DOWN001DIG
    oldToNewEditionMappings[0x53544a5350474d524e30303031444947] = 3900; // STJSPGMRN0001DIG
    oldToNewEditionMappings[0x4d4c4f454d4552474553485033444947] = 4000; // MLOEMERGESHP3DIG
    oldToNewEditionMappings[0x53544a42454530303030303030444947] = 4100; // STJBEE0000000DIG
    oldToNewEditionMappings[0x4d4c4f54414d45444c4e455331444947] = 4200; // MLOTAMEDLNES1DIG
    oldToNewEditionMappings[0x464b41494e5354415457454554444947] = 4300; // FKAINSTATWEETDIG
    oldToNewEditionMappings[0x464b414441464659305241494e444947] = 4400; // FKADAFFY0RAINDIG
    oldToNewEditionMappings[0x5354524752415353524f4f5453444947] = 4500; // STRGRASSROOTSDIG
    oldToNewEditionMappings[0x4d4c4f454d4552474553485032444947] = 4600; // MLOEMERGESHP2DIG
    oldToNewEditionMappings[0x53544a48505946524942495244444947] = 4700; // STJHPYFRIBIRDDIG
    oldToNewEditionMappings[0x53545254525453594d30303031444947] = 4800; // STRTRTSYM0001DIG
    oldToNewEditionMappings[0x4c484b42555a5a303030303031444947] = 4900; // LHKBUZZ000001DIG
    oldToNewEditionMappings[0x4c455645544845524d414e4630444947] = 5000; // LEVETHERMANF0DIG
    oldToNewEditionMappings[0x4f425844444632303030303030444947] = 5100; // OBXDDF2000000DIG
    oldToNewEditionMappings[0x4d4c4f54414d45444c4e455332444947] = 5200; // MLOTAMEDLNES2DIG
    oldToNewEditionMappings[0x53544a52554e52494f54303031444947] = 5300; // STJRUNRIOT001DIG
    oldToNewEditionMappings[0x4f544b43454c4c533030303030444947] = 5400; // OTKCELLS00000DIG
    oldToNewEditionMappings[0x484b5448554d414e4f4e453030444947] = 5500; // HKTHUMANONE00DIG
    oldToNewEditionMappings[0x535452454d4f4a493130303030444947] = 5600; // STREMOJI10000DIG
    oldToNewEditionMappings[0x4c4f5353455230314152543031444947] = 5700; // LOSSER01ART01DIG
    oldToNewEditionMappings[0x414b504d454c54303030303030444947] = 5800; // AKPMELT000000DIG
    oldToNewEditionMappings[0x505350424c5545303030303030444947] = 5900; // PSPBLUE000000DIG
    oldToNewEditionMappings[0x4d4c4f454d4552474553485031444947] = 6000; // MLOEMERGESHP1DIG
    oldToNewEditionMappings[0x54534d504f504556454e494e47303031] = 6100; // TSMPOPEVENING001
    oldToNewEditionMappings[0x4f425844444633303030303030444947] = 6200; // OBXDDF3000000DIG
    oldToNewEditionMappings[0x53545241505041494d4c455353444947] = 6300; // STRAPPAIMLESSDIG
    oldToNewEditionMappings[0x54534d54484559574154434830303031] = 6400; // TSMTHEYWATCH0001
    oldToNewEditionMappings[0x464b4142554e4e594241475330444947] = 6500; // FKABUNNYBAGS0DIG
    oldToNewEditionMappings[0x434e4a44495352505446494e31504859] = 6600; // CNJDISRPTFIN1PHY
    oldToNewEditionMappings[0x54534d46414345464c414d4553303031] = 6700; // TSMFACEFLAMES001
    oldToNewEditionMappings[0x464b414d41525449414e424e47444947] = 6800; // FKAMARTIANBNGDIG
  }

  function tokenSwap(uint256 _oldTokenId) public {

    bytes16 oldEdition = kodaV1.editionOf(_oldTokenId);
    uint256 newEdition = oldToNewEditionMappings[oldEdition];
    require(kodaV2.editionExists(newEdition), "Edition number is not valid");

    address owner = kodaV1.ownerOf(_oldTokenId);
    require(isApprovedForTransfer(_oldTokenId), "Token swap contract not approved for transfer");

    // call mint to old token owner
    uint256 _newTokenId = kodaV2.underMint(owner, newEdition);

    // transfer ownerShip of old token to archiveAddress
    kodaV1.transferFrom(owner, archiveAddress, _oldTokenId);

    emit TokenSwapped(_oldTokenId, _newTokenId, oldEdition, newEdition);
  }

  function oldToNewEdition(bytes16 oldEdition) public view returns (uint256 newEdition) {
    return oldToNewEditionMappings[oldEdition];
  }

  function editionMapping(uint256 _tokenId) public view returns (uint256 newEdition) {
    bytes16 oldEdition = kodaV1.editionOf(_tokenId);
    return oldToNewEditionMappings[oldEdition];
  }

  function isApprovedForTransfer(uint256 _tokenId) public view returns (bool) {
    address owner = kodaV1.ownerOf(_tokenId);
    return kodaV1.isApprovedForAll(owner, address(this));
  }
}
