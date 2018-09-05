const WS = require('./lib/ws');
const wsRSA = require('./lib/wsRSA');
const { UserOrder, UserAssets, DepthSell, DepthBuy, DealList } = require('./lib/data');
const Config = require('./config/config.js')

let ws = new WS({
    wsUrl: Config.wsUrl,
    userParam: {
        market: Config.market,
        uid: Config.uid
    }
});

/**
 * 整合实时成交记录
 */
let dealList = new DealList();
dealList.watch(function (val, old) {
    //console.log('dealList:\n', JSON.stringify(val));
});

/**
 * 整合挂单深度-卖单
 */
let depthSell = new DepthSell();
depthSell.watch(function (val, old) {
    //console.log('depthSell:\n', JSON.stringify(val));
});

/**
 * 整合挂单深度-买单
 */
let depthBuy = new DepthBuy();
depthBuy.watch(function (val, old) {
    //console.log('depthBuy:\n', JSON.stringify(val));
});


/**
 * 整合用户委托
 */
let userOrder = new UserOrder();
userOrder.watch(function (val, old) {
    //console.log('userOrder:\n', JSON.stringify(val));
});

/**
 * 保持连接(心跳)
 */
ws.on('push_heart', function (res) {
    //console.log('push_heart:\n', res);
});

/**
 * 鉴定订阅市场(登录)
 */
ws.on('push_user_market', function (res) {
    console.log('push_user_market:\n', res);
    if (res && res.data && res.data[0] == 0) {
        // 订阅挂单深度
        this.send('pull_merge_depth_order_list');
        // 订阅实时成交记录
        this.send("pull_deal_order_list");
        // 订阅行情24小时数据
        this.send('pull_home_market_quote');
        // 订阅行情K线走势
        this.send('pull_kline_graph', { "market": Config.market, "k_line_type": "15", "k_line_count": "200" });
        // 订阅用户余额
        this.send('pull_user_assets');
        // 订阅用户委托
        this.send('pull_user_order');
        // 订阅用户成交记录
        this.send('pull_user_deal');
    };
});


/**
 * 监听挂单深度
 */
ws.on('push_merge_depth_order_list', function (res) {
    console.log('push_merge_depth_order_list:\n', JSON.stringify(res));
    if (res && res.data) {
        depthSell.data = res.data.sell || [];
        depthBuy.data = res.data.buy || [];
    }
});

/**
 * 监听实时成交记录
 */
ws.on('push_deal_order_list', function (res) {
    console.log('push_deal_order_list:\n', JSON.stringify(res));
    if (res && res.data && Array.isArray(res.data)) {
        dealList.data = res.data;
    } else {
        console.error('错误的 push_deal_order_list 响应数据')
    };
});

/**
 * 监听行情24小时数据
 */
ws.on("push_home_market_quote", (res) => {
    console.log('push_home_market_quote:\n', JSON.stringify(res));
});

/**
 * 监听行情K线走势
 */
ws.on("push_kline_graph", (res) => {
    console.log('push_kline_graph:\n', JSON.stringify(res));
});

/**
 * 监听用户余额
 */
ws.on('push_user_assets', function (res) {
    console.log('push_user_assets:\n', JSON.stringify(res));
});

/**
 * 监听用户委托
 */
ws.on('push_user_order', function (res) {
    console.log('push_user_order:\n', JSON.stringify(res));
    var data = res.data || [];
    if (userOrder.state) {
        ws.send('pull_user_assets');
    };
    userOrder.data = data;
});

/**
 * 监听用户成交记录
 */
ws.on('push_user_deal', function (res) {
    console.log('push_user_deal:\n', JSON.stringify(res));
});


/**
 * 监听委托挂单
 */
ws.on("order_resp", (res) => {
    console.log('order_resp:\n', JSON.stringify(res));
    ws.checkErrorCode(res).then(data => {
        ws.send('pull_user_assets');
    }).catch(err => {
        console.log(err);
    });
});

/**
 * 监听委托撤单
 */
ws.on("withdrawal_resp", (res) => {
    console.log('withdrawal_resp:\n', JSON.stringify(res));
    ws.checkErrorCode(res).then(data => {
        ws.send('pull_user_assets');
    }).catch(err => {
        console.log(err);
    });
});



/**
 * 创建连接并登陆市场
 */
async function connect() {
    // 生成 RSA 公钥私钥
    let ciphertext = await wsRSA(Config.email, Config.rsaKey);
    console.log('ciphertext: ', ciphertext)
    ws.connect().then(() => {
        ws.userParam.rsa_ciphertext = ciphertext;
        // 订阅市场(登录)
        ws.send('pull_user_market', ws.userParam);
    }).catch(err => {
        console.error(`connect error:${err}`);
    });
}

connect();








