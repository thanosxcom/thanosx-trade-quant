[TOC]

# Thanosx-trade-quant

[Thanosx](https://www.thanosx.com/)交易平台量化交易API

----

## WS格式说明

* ws路径: wss://market.thanosx.com/sub
* ws 订阅发送utf8编码的json字符串
* ws 推送返回utf8 json字符串编码成binary的Buffer

```
Buffer.from(msg.binaryData, 'binary').toString('utf8');
```

## API说明

### 保持连接(心跳)
订阅
* 定时发送心跳请求，保持登录
* time 当前时间的时间戳
```json
{
    "method": "pull_heart",
    "data": {
        "time": "1536132685439"
    }
}
```

推送
* 心跳返回，只是表示心跳成功，无实际业务含义
```json
{
    "method": "push_heart",
    "data": [
        [
            "1536133078374"
        ]
    ]
}
```

### 订阅市场(登录)
订阅
* 用户相关的数据必须先登录以后才能订阅，未登录订阅用户数据可能会造成服务端主动关闭 websocket
* market 当前交易市场，使用“_”连接, 左边是交易货币，右边是支付货币。(必须字段)
* uid 用户id
* rsa_ciphertext  当前用户注册的email通过 RSA私钥加密后 base64 字符串，请用户先设置RSA公钥
```json
{
    "method":"pull_user_market",
    "data":{
        "market" : "tnsx_usdt",
        "uid" : "103",
        "rsa_ciphertext" : "rsa_ciphertext"
    }
}
```
推送
* 登录状态 data[0][0] == 1 ? "登录失败" : "登录成功"
```json
{
    "method":"push_user_market",
    "data":[
        ["0"]
    ]
}
```

#### 生成 RSA 公钥私钥
```bash
# 1024bit, pkcs8
node config/initRsa.js
```
或 [openssl](https://www.openssl.org/) 生成

### 订阅挂单深度
订阅
```json
{
    "method" : "pull_merge_depth_order_list"
}
```
推送
* 第一次推送是20条的深度数据，以后的推送是变动的深度数据（数据结构不变）。你要自己合并深度，详情查看demo 
* [价格,数量]
```json
{
    "method": "push_merge_depth_order_list",
    "data": {
        "buy": [
            [
                "10.50000000",
                "100.00000000"
            ]
        ],
        "sell": [
            [
                "11.00000000",
                "100.00000000"
            ]
        ],
        "tip": "本体"
    }
}
```

### 订阅实时成交记录
订阅
```json
{
  "method" : "pull_deal_order_list",
}
```
推送
* [时间戳, 交易类型(buy/sell）,成交价,成交数量,订单号]
```json
{
    "method": "push_deal_order_list",
    "data": [
        [
            1536041649735,
            "sell",
            "11.00000000",
            "100.00000000",
            "1536024551756931493"
        ],
        [
            1536041658637,
            "buy",
            "11.00000000",
            "100.00000000",
            "1536024551756931495"
        ]
    ]
}
```

### 订阅行情24小时数据
订阅
* 未先订阅交易对订阅行情会返回所有的交易对行情，需要先单独订阅一个交易对

```json
{
  "method" : "pull_home_market_quote",
}
```
推送
* 第一次初始化，后面增量推送
* data["支付货币"]["交易货币"]
* [交易对, 最新成交价, 24h涨跌, 24h最高价, 24h最低价, 24h成交量, 24h成交额, 交易货币¥单价折算, 支付货币¥单价折算]
```json
{
    "method": "push_home_market_quote",
    "data": {
        "usdt": {
            "tnsx": [
                "tnsx_usdt",
                "10.00000000",
                "0.00000000",
                "11.00000000",
                "0.00000000",
                "400.00000000",
                "4200.00000000",
                "0.00000000",
                "0.00000000"
            ]
        }
    }
}
```

### 订阅行情K线走势
订阅
* market 交易对，交易对切换，需要重新订阅
* k_line_type K线类型，单位为分钟的数字，字符串类型
* k_line_count k线数据长度，最大200
```json
{
    "method" : "pull_kline_graph",
    "data" : {
        "market" : "tnsx_usdt",
        "k_line_type" : "1",
        "k_line_count" : "200",
    }
}
```
推送
* [时间戳，开盘价，最高价，最低价，收盘价，成交量]
* 第一次推送数据初始化，后面推送是增量更新。
```json
{
    "method": "push_kline_graph",
    "data": [
        [
            "1536041580000",
            "10.00000000",
            "11.00000000",
            "10.00000000",
            "10.00000000",
            "400.00000000"
        ]
    ]
}
```

### 订阅用户余额
订阅
```json
{
  "method" : "pull_user_assets"
}
```
推送
* free_service_charge 是否免交易手续费
* asset 余额，浮点字符串
```json
{
    "method": "push_user_assets",
    "data": {
        "uid": "103",
        "free_service_charge": "1",
        "asset": {
            "eth": "99972968",
            "tnsx": "14250.2345",
            "usdt": "10026.0213",
            "xrp": "100000"
        },
        "freeze_asset": {}
    }
}
```

### 订阅用户委托
订阅
* max_count 获取的委托挂单数量，-1获取全部委托，默认30
```json
{
  "method" : "pull_user_order",
  "data" : {
    "max_count" : "30"
  }
}
```
推送
* 第一次推送最多 max_count 条数的委托，后面推送变动的数据
* [订单号，时间，类型，价格，未成交数量，委托数量，状态（ing委托中，withdrawal撤单）]
```json
{
    "method": "push_user_order",
    "data": [
        [
            "1536024551756931499",
            1536041695000,
            "sell",
            "11.00000000",
            "100.00000000",
            "100.00000000",
            "ing"
        ],
        [
            "1536024551756931498",
            1536041682000,
            "buy",
            "10.50000000",
            "100.00000000",
            "100.00000000",
            "ing"
        ]
    ]
}
```

### 订阅用户成交记录
订阅
```json
{
  "method" : "pull_user_deal",
}
```
推送
* 推送数据结构同用户当前交易对委托  push_user_order
```json
{
    "method": "push_user_deal",
    "data": [
        [
            "1536024551756931490",
            1536041639808,
            "buy",
            "10.00000000",
            "100.00000000",
            "100.00000000",
            "deal",
            0
        ],
        [
            "1536024551756931491",
            1536041639808,
            "sell",
            "10.00000000",
            "100.00000000",
            "100.00000000",
            "deal",
            1
        ]
    ]
}
```

### 用户委托挂单
订阅
* type 类型 Buy/Sell
* price 价格
* count 数量
* ts 当前毫秒时间戳
```json
{
    "method" : "order",
    "data" : {
        "type" : "Buy",
        "price" : "100001",
        "count" : "0.0001",
        "ts" : 1529402865467
    }
}
```
推送
* [error_code](#error_code)
```json
{
    "method":"order_resp",
    "data":{
        "order_id":"1529401690299552951",
        "error_code":0
    }
}
```

### 用户委托撤单
订阅
* order_id 订单号
```json
{
    "method" : "withdrawal",
    "data" : {
        "order_id" : "1529401690299552949"
    }
}
```
推送
* [error_code](#error_code)
```json
{
    "method":"withdrawal_resp",
    "data":{
        "order_id":"1529401690299552949",
        "error_code":0
    }
}

```

## 错误码
| error_code |             text             |
|------------|------------------------------|
|          1 | 无效的订单                   |
|          2 | 余额不足                     |
|          3 | 服务端解析发送的json数据出错 |
|          7 | 无效的用户ID                 |
|          8 | 无效的价格                   |
|          9 | 无效的个数                   |
|         12 | 无效的买卖类型               |
|         13 | 无效验证的用户               |
|         14 | 交易区暂未开放               |
|            |                              |

