const express=require('express');
const cors=require('cors');
const mongoose = require('mongoose');
const User=require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const app=express();
const bcryptSalt = bcrypt.genSaltSync(10);
app.use(express.json());
// FjmgVvLaqSQG7DPN
// console.log(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL);
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173',
  }));
app.post('/register',async (req,res)=>{
    const {name,email,password} = req.body;

  try {
    const userDoc = await User.create({
      name,
      email,
      password:bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
})
app.post('/login',async (req,res)=>{
    const {email,password} = req.body;

  try {
    const userDoc = await User.findOne({email});
     
    if(userDoc){
        res.json('user found');
    }else{
        res.json('user not found');
    }
  } catch (e) {
    res.json('not found')
    // res.status(422).json(e);
  }
})

app.listen(8001);