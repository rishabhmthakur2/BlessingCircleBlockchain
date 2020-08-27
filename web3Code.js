var Web3 = require('web3')
var Contract = require('web3-eth-contract')

var web3 = new Web3(
    Web3.givenProvider ||
      new Web3.providers.WebsocketProvider('ws://remotenode.com:8546'),
  );
  
  var myContract = new web3.eth.Contract(
    [
      {
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'constructor',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: '_from',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: '_to',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: '_value',
            type: 'uint256',
          },
        ],
        name: 'Payout',
        type: 'event',
      },
      {
        inputs: [],
        name: 'balanceOf',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'invest',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address payable',
            name: '_reciepent',
            type: 'address',
          },
          {
            internalType: 'enum BlessingCircle.InvestmentCircle',
            name: '_investmentType',
            type: 'uint8',
          },
        ],
        name: 'payout',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    '0x3FB6C9FD96fD70B46C214E062aCDAA5Bb1CF0138',
  );
  
  let response = myContract.methods.balanceOf().call().then(console.log);