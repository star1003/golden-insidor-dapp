import ABI from '@/constants/abi';

const host = '';

export default {
  API_BASE_URL: `https://${host}`,
  // PARSE_APP_ID: 'tokenix',
  // PARSE_MASTER_KEY: 'tokenix_master',
  // PARSE_URL: "https://backend.tokenix.org/tokenix",
  // PARSE_LIVE_QUERY_URL: 'ws://localhost:1338',
  // PARSE_JS_KEY: '',
  
  // PARSE_APP_ID: 'MAxYiYbOoAYpKj5ZRa4fr3UF0WnHyjXVdraxfNy0',
  // PARSE_MASTER_KEY: '',
  // PARSE_URL: "https://parseapi.back4app.com/",
  // PARSE_LIVE_QUERY_URL: 'ws://localhost:1338',
  // PARSE_JS_KEY: '3iy5jY0I2VMxNmI1qXktTk9DEGkFAkHYvAkTAv3P',
  ZERION_API_KEY: 'Zerion.oSQAHALTonDN9HYZiYSX5k6vnm4GZNcM',

  PARSE_APP_ID: 'insidor',
  PARSE_MASTER_KEY: '',
  PARSE_URL: `https://${host}/insidor`,
  PARSE_LIVE_QUERY_URL: `ws://${host}:1338`,
  PARSE_JS_KEY: '',
  
  PARSE_DEFAULT_PASSWORD: 'sniper',
  
  
  ADMIN: '0x0000',

  CHAIN_ID: 1, // 1: eth mainnet, 4: rinkeby, 1337: localhost, 5777: ganache, 56: BSC
  // CHAIN_NAME: 'Ethereum Mainnet',
  // FLASHBOT_RPC: 'http://localhost:3000',
  // RPC_URL: 'https://golden2dm.com/rpc/1',
  RPC_URL: 'https://eth.rpc.blxrbdn.com',
  // RPC_URL: 'https://intensive-convincing-research.quiknode.pro/ed47b8495b0124dd23b018b467e1b8cde3f05fba  ',
  INFURA_ID: '4a4c8524461c4c4dbad965a3eabb7334',
  FLASHBOT_RPC: `https://${host}`,
  BEAVER_ADDRESS: "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5",
  
  RELAY_PRIVATE_KEY: '0xd0f84e02a95978fead18e75767f9f7a8bbe15ae916fed99e2e3b6637a6d1b551',

  // Socket configrations
  NETWORK: 'main', // bsc-main, rinkeby, main
  // # CURVE FI : c68d8ec3-9b9a-4ba5-a3eb-6232eff79030
  // # ZAPEER FI : b4264111-41d0-4768-a86f-30a0d9d46d07
  // # staking.synthetix.io : e72e44c7-d688-4e0e-82a1-6ceb410b2992
  // # app.balancer.fi : 032e2fb8-6c66-46a5-bf1c-a049ac7eded2
  // # app.compound.finance : 2bec4afa-0e12-48a7-aaa2-bf0d67abbf81
  SOCKET_DAPP_ID: 'e72e44c7-d688-4e0e-82a1-6ceb410b2992',

  MIN_SNIPER_VALUE: 0,
  MIN_SNIPER_VALUE_FOR_COPY_TRADING: 0.5,
  MIN_DETAILS_SNIPER_AMOUNT: 0,
  // SNIPER_ADDRESS: '0x6E927bc495458Aa1C99785A02aD0682EDB17d7E3',
  // ESCROW_ADDRESS: '0xb5982B232e4258De130fBC9fE2a486FC65f9Df95',
  // ROUTER_ADDRESS: '0x4d334331cCd6F73F9f39F6f7b62544e15677e9e4',

  SNIPER_ADDRESS: '0xb8fb35e3406e597e5f86d4f3c0e3063a6fab71a5',

  MAINNET_RPC: 'https://golden2dm.com/rpc/1',
  MAINNET_UNI_ROUTER_ADDRESS: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
  MAINNET_WETH_ADDRESS: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',

  // BSC escrow 0xf965f1995A6CC011524F8762d811F64f1045777E, MAIN 0x89d7c52b999DE0f2D862eD944203BFA0526AE973
  // BSC router 0x9d1a0E3492F16Ad58E744071e41483495537e488, MAIN 0xf05dab17B820063Ca143303641adD237C3cA9d32
  ETH_ESCROW_ADDRESS: '0x89d7c52b999DE0f2D862eD944203BFA0526AE973', // Main
  RINKEBY_ESCROW_ADDRESS: '0x3e4dEaB798b75FB19E3305cf2DDc83032940A24c', // Test
  BSC_ESCROW_ADDRESS: '0xf965f1995A6CC011524F8762d811F64f1045777E', // BSC

  ETH_ROUTER_ADDRESS: '0xf05dab17B820063Ca143303641adD237C3cA9d32',
  RINKEBY_ROUTER_ADDRESS: '0xAAa83841d5a6Ea44E90Cd534d2e470005e4633c3',
  BSC_ROUTER_ADDRESS: '0x9d1a0E3492F16Ad58E744071e41483495537e488',

  ETH_TOP_AGGREGATOR_ADDRESS: '0x0EE1AF240E39bbb34780907e85d56c0FE3b18Bd3', // Main
  ETH_AGGREGATOR_ADDRESS: '0x0EE1AF240E39bbb34780907e85d56c0FE3b18Bd3', // Main
  BASE_TOP_AGGREGATOR_ADDRESS: '0xD88b290546cdc228e4fda5419aA8bF2c3Be6E058', // BASE
  BASE_AGGREGATOR_ADDRESS: '0xD88b290546cdc228e4fda5419aA8bF2c3Be6E058', // BASE
  // ETH_AGGREGATOR_ADDRESS: '0xe72889F88f279043206698c50B752FC6eb47b63f', // Main
  RINKEBY_AGGREGATOR_ADDRESS: '0xf2Ca019454C5e0dcdcBD8e3539CcfCF00850e148', // Test
  BSC_TOP_AGGREGATOR_ADDRESS: '0x67fE8ff0Bb49c348ebA76DE08eA1f50d53511C9c', // Main
  BSC_AGGREGATOR_ADDRESS: '0x67fE8ff0Bb49c348ebA76DE08eA1f50d53511C9c', // BSC
  CRO_AGGREGATOR_ADDRESS: '', // CRO

  // ETH_ROUTER_V2_ADDRESS: '0x3FC51AAEd6Faab15F5B4e95C64664C59Ef170781',
  ETH_ROUTER_V2_ADDRESS: '0x2Df45aB47BD583f7148825a6076996E34f18e442',
  ETH_TOP_ROUTER_V2_ADDRESS: '0x2Df45aB47BD583f7148825a6076996E34f18e442',
  BASE_ROUTER_V2_ADDRESS: '0x7481333B44ef614fBd3558Eb0Fac043cCFBC14A4',
  BASE_TOP_ROUTER_V2_ADDRESS: '0x7481333B44ef614fBd3558Eb0Fac043cCFBC14A4',
  RINKEBY_ROUTER_V2_ADDRESS: '0x39a70EDaC9413F4A71ea9c682b2c62095b165A7b',
  BSC_TOP_ROUTER_V2_ADDRESS: '0x6CC4a943b0323d4AC6E4077245B4C1a81C19d727',
  BSC_ROUTER_V2_ADDRESS: '0x6CC4a943b0323d4AC6E4077245B4C1a81C19d727',
  CRO_ROUTER_V2_ADDRESS: '',

  ETH_WETH_ADDRESS: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  BASE_WETH_ADDRESS: '0x4200000000000000000000000000000000000006',
  RINKEBY_WETH_ADDRESS: '0xc778417e063141139fce010982780140aa0cd5ab',
  BSC_WETH_ADDRESS: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  CRO_WETH_ADDRESS: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',

  BASE_DEX_LIST: [
    {
      title: 'UniSwapV2',
      address: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6', // factory
      router: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
      abi: ABI.UniswapRouterABI
    }
  ],

  ETH_DEX_LIST: [
    {
      title: 'UniSwapV2',
      address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // factory
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      abi: ABI.UniswapRouterABI
    },
    {
      title: 'Vista',
      address: '0x9a27cb5ae0B2cEe0bb71f9A85C0D60f3920757B4', // factory
      router: '0xEAaa41cB2a64B11FE761D41E747c032CdD60CaCE',
      abi: ABI.VistaRouterABI
    },
    {
      title: 'SushiSwap',
      address: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      router: '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f',
      abi: ABI.UniswapRouterABI
    },
    {
      title: 'UniSwapV3',
      address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      isCopyTrading: true,
    },
    // {
    //   title: 'DegenSwap',
    //   address: '0x5c515455efb90308689579993c11a84fc41229c0',
    //   router: '0x4bf3E2287D4CeD7796bFaB364C0401DFcE4a4f7F',
    //   isDirect: true, // indicates if can't buy through our router
    //   abi: ABI.UniswapRouterABI
    // }
  ],
  CRO_DEX_LIST: [
    {
      title: 'MMF Swap',
      address: '0xd590cc180601aecd6eeadd9b7f2b7611519544f4',
      router: '0x145677fc4d9b8f19b5d56d1820c48e0443049a30',
      isDirect: true // indicates if can't buy through our router
    }
  ],
  RINKEBY_DEX_LIST: [
    {
      title: 'Uniswap',
      address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      abi: ABI.UniswapRouterABI
    },
    {
      title: 'UniSwapV3',
      address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      isCopyTrading: true,
    },
  ],
  BSC_DEX_LIST: [
    {
      title: 'PancakeSwap',
      address: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
      router: '0x10ED43C718714eb63d5aA57B78B54704E256024E'
    }
  ],

  IS_TEST: false,
}
