const express = require('express')
const router = new express.Router()
const Circle = require('../models/investmentModel')
const mongoose = require('mongoose')

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

let pushParticipantToCircle = async (filledCircle, senderAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      filledCircle.participants = filledCircle.participants.concat({
        investor: senderAddress,
        position: filledCircle.participants.length + 1,
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
  paymentToBeMade = true;
  paymentToBeMadeAddress = filledCircle.participants[0].investor;
  investmentType = filledCircle.investmentAmount;
  return new Promise(async (resolve, reject) => {
    let newCircle1 = await createNewCircle(filledCircle.investmentAmount)
    let newCircle2 = await createNewCircle(filledCircle.investmentAmount)
    try {
      for (let i = 2; i < 9; i++) {
        try {
          filledCircle.participants[i - 1].position -= 1;
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
          filledCircle.participants[i - 1].position -= 1;
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
  paymentToBeMade = false
  paymentToBeMadeAddress = '0x14892700213f98628C9033642476996d1d730572'
  let senderAddress = req.body.senderAddress
  let investmentAmount = req.body.investmentAmount
  if (
    investmentAmount != '0.1' &&
    investmentAmount != '0.5' &&
    investmentAmount != '1'
  ) {
    res.status(400).send('Invalid investment amount')
  }
  let availableCircles = []
  availableCircles = await Circle.find({ investmentAmount }).sort({ _id: 1 })
  if (availableCircles.length == 0) {
    let newCircle = await createNewCircle(investmentAmount)
    await availableCircles.push(newCircle)
  }
  try {
    await pushParticipantToCircle(availableCircles[0], senderAddress)
    res.status(200).send({
      message: 'Investment completed',
      paymentStatus: paymentToBeMade,
      address: paymentToBeMadeAddress,
    })
  } catch (error) {
    res.status(400).send(error)
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
});

router.get('/checkCircleAlmostFull?:id', async (req, res) => {
  paymentToBeMadeAddress = '0x14892700213f98628C9033642476996d1d730572'
  let participantAddress = req.query.id;
  let investmentAmount = req.query.amount;
  try {
    let availableCircles = []
    availableCircles = await Circle.find({ investmentAmount }).sort({ _id: 1 })
    if (availableCircles.length > 0) {
      if (availableCircles[0].participants.length == 14) {
        paymentToBeMadeAddress =
              availableCircles[0].participants[0].investor;

        res.status(200).send({
          paymentStatus: true,
          address: paymentToBeMadeAddress,
        });
      } else {
        res.status(200).send({
          paymentStatus: false,
          address: paymentToBeMadeAddress,
        })
      }
    } else {
      res.status(200).send({
        paymentStatus: false,
        address: paymentToBeMadeAddress,
      })
    }
  } catch (error) {
    res.status(400).send(error)
  }
})

module.exports = router
