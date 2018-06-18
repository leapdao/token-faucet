# Parsec Testnet Faucet

Reload Duration: **24h / address**  
Amount Dispensed: **10 PSC**  

Instructions:

1. Publish a tweet including your address.
2. Post the tweet URL to the faucet like this:

```
curl -X POST
  -H 'Content-Type: application/json' 
  -d '{
    "tweetUrl": "https://twitter.com/JohBa/status/1008271083080994817"
  }'
https://sarrsmlpsg.execute-api.eu-west-1.amazonaws.com/v0/tweetFund
```

## LICENSE

Project source files are made available under the terms of the GNU Affero General Public License (GNU AGPLv3). See individual files for details.