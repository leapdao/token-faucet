# Token Faucet

Reload Duration: **24h / address**  
Amount Dispensed: **1 LEAP**  

Instructions:

1. Publish a tweet including your address and @leapdao handle.
2. Post the tweet URL to the faucet like this:

```
curl -X POST
  -H 'Content-Type: application/json' 
  -d '{
    "tweetUrl": "https://twitter.com/JohBa/status/1008271083080994817"
  }'
https://jw98dxp219.execute-api.eu-west-1.amazonaws.com/testnet
```

🤫 Secret non-twitter instructions 🤫 :

2. Post your address and token color to the faucet like this:

```
curl -X POST
  -H 'Content-Type: application/json' 
  -d '{
    "address":"0x8db6B632D743aef641146DC943acb64957155388",
    "color": 1
  }'
https://jw98dxp219.execute-api.eu-west-1.amazonaws.com/testnet/address/
```

## Setup

Create required properties in [AWS parameter store](https://eu-west-1.console.aws.amazon.com/systems-manager/parameters/?region=eu-west-1):

> Tip: you can use `aws ssm put-parameter` CLI

### Twitter credentials:

```
"Name": "/faucet/TW_ACCESS_TOKEN_KEY",
"Type": "String",

"Name": "/faucet/TW_ACCESS_TOKEN_SECRET",
"Type": "String",

"Name": "/faucet/TW_CONSUMER_KEY",
"Type": "String",

"Name": "/faucet/TW_CONSUMER_SECRET",
"Type": "String",
```

### Private key holding tokens on Plasma:

1. Put your target env in the name (e.g. `/faucet/testnet/PRIV_KEY`)
2. Encrypt with KMS key

```
"Name": "/faucet/<env>/PRIV_KEY",
"Type": "SecureString",
```


## Deploy

1. Execute deployment:
```
KMS_KEY_ID=<kms-key-id> PROVIDER_URL=<leap-node-json-rpc-url> AMOUNT=<amount-to-dispense> ATTEMPTS_PER_ACCOUNT=<max-requests-per-twitter-account> sls deploy -s <env>
```

Skip `ATTEMPTS_PER_ACCOUNT` or set it to 0 to allow unlimited requests from same twitter account.

2. (First deployment only) Set up `dispenseTokens` lambda to run on new SQS message.
⚠️ It is a unsolved issue in serverless config — it should be set up with serverless, but isn't working for some reason.

### Testnet

```
yarn deploy:testnet
```

### Mainnet

```
yarn deploy:mainnet
```