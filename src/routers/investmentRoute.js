const express = require('express')
var request = require('request')
const router = new express.Router()
const Circle = require('../models/investmentModel')
const Investment = require('../models/transactionModel')
const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

let TronWeb = require('tronweb')

let tronWeb = new TronWeb({
  fullNode: 'https://api.shasta.trongrid.io',
  solidityNode: 'https://api.shasta.trongrid.io',
  eventServer: 'https://api.shasta.trongrid.io',
})

// let eventListenerForCalls = async () => {
//   let transactionIds = []
//   const blessingCircle = await tronWeb
//     .contract()
//     .at('TTJZdL2nYRpqtHNMLaroqmAB3kVPrrbBpU')
//   console.log(blessingCircle);
//   blessingCircle.transactionReceived().watch((err, eventResult) => {
//     console.log('Inside');
//     if (err){
//       console.log('Error in watch event:', err);
//     }
//     if (eventResult) {
//       console.log(eventResult)
//       let transactionId = eventResult.result.id
//       let sender = eventResult.result._sender
//       let transactionAmount = eventResult.result._transactionAmount
//       console.log('Event Received')
//       if (transactionIds.indexOf(transactionId) > -1) {
//       } else {
//         transactionIds.push(transactionId)
//         try {
//           var options = {
//             method: 'POST',
//             url: 'http://blessingcircle.herokuapp.com/invest',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               senderAddress: sender,
//               investmentAmount: transactionAmount,
//               transactionId: transactionId,
//             }),
//           }
//           request(options, function (error, response) {
//             if (error) throw new Error(error)
//             console.log(response.body)
//           })
//         } catch (error) {
//           console.log(error)
//         }
//       }
//     }
//   })
// }
// eventListenerForCalls()

let paymentToBeMade
let paymentToBeMadeAddress

let createNewCircle = async (investmentAmount) => {
  return new Promise(async (resolve, reject) => {
    const investment = new Circle({
      investmentAmount,
    })
    try {
      await investment.save()
      resolve(investment)
    } catch (error) {
      reject(error)
    }
  })
}

let pushParticipantToCircle = async (
  filledCircle,
  senderAddress,
  transactionId,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      filledCircle.participants = filledCircle.participants.concat({
        investor: senderAddress,
        position: filledCircle.participants.length + 1,
        transactionId,
      })
      filledCircle.participantCount += 1
      await filledCircle.save()
      if (filledCircle.participantCount == 15) {
        payAndSplitCircle(filledCircle).then(() => {
          resolve('Participant added and Circle Split into two')
        })
      }
      resolve('Participant added to blessing circle')
    } catch (error) {
      reject(error)
    }
  })
}

let payAndSplitCircle = async (filledCircle) => {
  // Pay to 1st address
  paymentToBeMade = true
  paymentToBeMadeAddress = filledCircle.participants[0].investor
  investmentType = filledCircle.investmentAmount
  return new Promise(async (resolve, reject) => {
    let newCircle1 = await createNewCircle(filledCircle.investmentAmount)
    let newCircle2 = await createNewCircle(filledCircle.investmentAmount)
    try {
      for (let i = 2; i < 9; i++) {
        try {
          filledCircle.participants[i - 1].position -= 1
          newCircle1.participants = newCircle1.participants.concat(
            filledCircle.participants[i - 1],
          )
          newCircle1.participantCount += 1
          await newCircle1.save()
        } catch (error) {
          throw new Error('Error in adding participant to new Circle')
        }
      }
      for (let i = 9; i < 16; i++) {
        try {
          filledCircle.participants[i - 1].position -= 1
          newCircle2.participants = newCircle2.participants.concat(
            filledCircle.participants[i - 1],
          )
          newCircle2.participantCount += 1
          await newCircle2.save()
        } catch (error) {
          throw new Error('Error in adding participant to new Circle')
        }
      }
      try {
        delete (await Circle.findByIdAndRemove({ _id: filledCircle._id }))
      } catch (error) {
        console.log(error)
      }
    } catch (error) {
      reject(error)
    }
  })
}

router.post('/invest', async (req, res) => {
  let transactionIds = []
  paymentToBeMade = false
  paymentToBeMadeAddress = 'TRPrKjJNjLAUBVHmtCLVyE9RUAGTBN1sc1'
  let senderAddress = req.body.senderAddress
  let investmentAmount = req.body.investmentAmount
  let transactionId = req.body.transactionId
  if (
    investmentAmount != '100000000' &&
    investmentAmount != '500000000' &&
    investmentAmount != '1000000000'
  ) {
    res.status(400).send('Invalid investment amount')
  }
  let availableCircles = []
  availableCircles = await Circle.find({ investmentAmount }).sort({ _id: 1 })
  if (availableCircles.length == 0) {
    let newCircle = await createNewCircle(investmentAmount)
    await availableCircles.push(newCircle)
  }
  if (transactionIds.indexOf(transactionId) > -1) {}
  else{
  transactionIds.push(transactionId)

    try {
      await pushParticipantToCircle(
        availableCircles[0],
        senderAddress,
        transactionId,
      )
      res.status(200).send({
        message: 'Investment completed',
        paymentStatus: paymentToBeMade,
        address: paymentToBeMadeAddress,
      })
    } catch (error) {
      res.status(400).send(error)
    }
  }
})

router.get('/findPosition?:id', async (req, res) => {
  let participantAddress = req.query.id
  let investmentAmount = req.query.amount
  let foundCircle = await Circle.findOne({
    investmentAmount,
    participants: { $elemMatch: { investor: participantAddress } },
  })
  if (foundCircle) {
    for (let i = 0; i < foundCircle.participants.length; i++) {
      if (foundCircle.participants[i].investor == participantAddress) {
        if (foundCircle.participants[i].position == 1) {
          return res.status(200).send({
            message: `Congratulations, Your position is: ${foundCircle.participants[i].position}.\nThe circle currently has ${foundCircle.participants.length} participants.\nYou will be paid when the circle gets full (15 participants).`,
          })
        } else {
          return res.status(200).send({
            message: `Your position is: ${foundCircle.participants[i].position}.\nThe circle currently has ${foundCircle.participants.length} participants.\nYou will be paid when you reach Position 1 of a circle and it gets full (15 participants).`,
          })
        }
      }
    }
  } else {
    return res
      .status(404)
      .send({ message: 'No investment found with that address!' })
  }
})

router.get('/checkCircleAlmostFull?:id', async (req, res) => {
  paymentToBeMadeAddress = 'TRPrKjJNjLAUBVHmtCLVyE9RUAGTBN1sc1'
  let transactionId = uuidv4()
  let participantAddress = req.query.id
  let investmentAmount = req.query.amount
  try {
    let availableCircles = []
    availableCircles = await Circle.find({ investmentAmount }).sort({ _id: 1 })
    if (availableCircles.length > 0) {
      if (availableCircles[0].participants.length == 14) {
        paymentToBeMadeAddress = availableCircles[0].participants[0].investor

        res.status(200).send({
          transactionId,
          paymentStatus: true,
          address: paymentToBeMadeAddress,
        })
      } else {
        res.status(200).send({
          transactionId,
          paymentStatus: false,
          address: paymentToBeMadeAddress,
        })
      }
    } else {
      res.status(200).send({
        transactionId,
        paymentStatus: false,
        address: paymentToBeMadeAddress,
      })
    }
  } catch (error) {
    res.status(400).send(error)
  }
})

router.post('/transactionReceived', async (req, res) => {
  let transactionId = req.body.transactionId
  let investmentAmount = req.body.transactionAmount
  let investorAddress = req.body.sender
  // console.log(req.body);
  try {
    let investment = new Investment({
      transactionId,
      investmentAmount,
      investorAddress,
    })
    await investment.save()
    res.status(200).send()
  } catch (error) {
    res.status(400).send(error)
  }
})

module.exports = router
