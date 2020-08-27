const defaultAddress = '0x96B560a99648d4897E3aAdF62347fEB978A1daBE';
const inputAddress = document.getElementById('input-address');
inputAddress.setAttribute('placeholder', defaultAddress);
inputAddress.innerText = defaultAddress;
var inputAmount;
var radio1 = document.getElementById('pointOne');
var radio2 = document.getElementById('pointFive');
var radio3 = document.getElementById('one');
document.getElementById('btn-check').onclick = async function () {
    if(radio1.checked){
        inputAmount = 0.1
    }
    if(radio2.checked){
        inputAmount = 0.5
    }
    if(radio3.checked){
        inputAmount = 1;
    }
    console.log(inputAddress.value);
    console.log(inputAmount);
    await fetch('/findPosition?id='+inputAddress.value+'&amount='+inputAmount, {
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