var response = http.get('https://playground.testnet.verana.network/api/demo/' + SERVICE + '/credential/' + EXCHANGE_ID)
console.log('exchange state ' + response.status + ' ' + response.body)
output.exchangeDone = json(response.body).done === true
