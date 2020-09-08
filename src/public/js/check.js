const defaultAddress = 'TMykJyzLZandftjYtYtgddXurGXfgXugUG';
const inputAddress = document.getElementById('input-address');
inputAddress.setAttribute('placeholder', defaultAddress);
inputAddress.innerText = defaultAddress;
var inputAmount;
var radio1 = document.getElementById('pointOne');
var radio2 = document.getElementById('pointFive');
var radio3 = document.getElementById('one');

document.getElementById('btn-check').onclick = async function () {
    if(radio1.checked){
        inputAmount = 1000
    }
    if(radio2.checked){
        inputAmount = 6000
    }
    if(radio3.checked){
        inputAmount = 15000;
    }
    console.log(inputAddress.value);
    console.log(inputAmount);
    let tronAddress = window.tronWeb.address.toHex(inputAddress.value);
    console.log(tronAddress);
    await fetch('/findPosition?id='+tronAddress+'&amount='+inputAmount*1000000, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*'
        }
    }).then((response)=>{
        return response.json();
    }).then((data)=>{
        const messageArea = document.getElementById('position');
        messageArea.innerText = data.message;
    });
  }