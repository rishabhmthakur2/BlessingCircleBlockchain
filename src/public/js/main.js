console.log('File loaded')
let web3

let handleSendTransaction = async (amount) => {
  if (!amount) {
    window.alert('Please choose amount to invest')
  } else if (!window.tronWeb) {
    window.alert('Not connected to a Tron Wallet')
  } else {
    const senderAddress = await window.tronWeb.defaultAddress.hex
    const blessingCircle = await tronWeb
      .contract()
      .at('TBGE95XFkzhNahsrA4PjvaKuykfPQGvbCU')
    try {
      fetch(
        '/checkCircleAlmostFull?id=' + senderAddress + '&amount=' + amount*1000000,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
          },
        },
      )
        .then((response) => {
          return response.json()
        })
        .then(async (data) => {
            blessingCircle
              .invest(data.transactionId, data.paymentStatus, data.address)
              .send({
                callValue: amount * 1000000,
              })
              .then(async (response) => {
                // alert('You can check your position once your transaction has been confirmed.\nThis usually takes about 5-10 minutes depending on Gas and network congestion.\nClock on "View Transaction button to view transaction status.\nYour transaction should start reflecting on Tronscan in 2-3 minutes.')
                document.getElementById('btn-send').value = 'View Transaction'
                document.getElementById('btn-send').onclick = function () {
                  window.open(
                    'https://shasta.tronscan.org/#/transaction/' + response,
                  )
                  window.location.reload()
                }
              });
          })
        } catch (error) {
      window.alert(JSON.stringify(error))
    }
  }
}
var inputAmount
var radio1 = document.getElementById('pointOne')
var radio2 = document.getElementById('pointFive')
var radio3 = document.getElementById('one')

document.getElementById('btn-send').onclick = function () {
  if (radio1.checked) {
    inputAmount = 100
  }
  if (radio2.checked) {
    inputAmount = 500
  }
  if (radio3.checked) {
    inputAmount = 1000
  }
  handleSendTransaction(inputAmount)
}
