const express=require('express');
const cors=require('cors');
const mongoose = require('mongoose');
const jwt=require('jsonwebtoken');
const User=require('./models/User');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const imageDownloader = require('image-downloader');
const Place = require('./models/Place.js');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const app=express();
const bcryptSalt = bcrypt.genSaltSync(10);
app.use('/uploads', express.static(__dirname+'/uploads'));
app.use(cookieParser());
app.use(express.json());
// FjmgVvLaqSQG7DPN
// console.log(process.env.MONGO_URL);
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdff';
mongoose
     .connect(process.env.MONGO_URL, 
     { useNewUrlParser: true,  useUnifiedTopology: true })
     .then(() => console.log( 'Database Connected' ))
     .catch(err => console.log( err ));

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
      //  res.json('Ok');
      const {email,password} = req.body;
      const userDoc = await User.findOne({email});
      if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
          jwt.sign({
            email:userDoc.email,
            id:userDoc._id
          }, jwtSecret, {}, (err,token) => {
            if (err) throw err;
            res.cookie('token', token,).json(userDoc);
          });
        } else {
          res.status(422).json('pass not ok');
        }
      } else {
        res.json('not found');
      }
})
app.get('/profile', (req,res) => {
  // mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const {name,email,_id} = await User.findById(userData.id);
      res.json({name,email,_id});
    });
  } else {
    res.json(null);
  }
});

app.post('/logout', (req,res) => {
  res.cookie('token', '').json(true);
});

app.post('/upload-by-link', async (req,res) => {
  const {link} = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
  // console.log(newName);
  await imageDownloader.image({
    url: link,
    dest: __dirname+'/uploads/'+newName,
  });
  // const url = await uploadToS3('/tmp/' +newName, newName, mime.lookup('/tmp/' +newName));
  res.json(newName);
});
// console.log(__dirname);
const photosMiddleware = multer({dest:'uploads/'});
app.post('/upload', photosMiddleware.array('photos', 100), async (req,res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const {path,originalname} = req.files[i];
    const parts=originalname.split('.');
    const ext=parts[parts.length-1];
    const newPath=path+'.'+ext;
    fs.renameSync(path,newPath);
    // const url = await uploadToS3(path, originalname, mimetype);
    // console.log(newPath.substring(8))
    
    uploadedFiles.push(newPath.substring(8));
  }
  res.json(uploadedFiles);
});

app.post('/places', (req,res) => {
  // mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  const {
    title,address,addedPhotos,description,price,
    perks,extraInfo,checkIn,checkOut,maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner:userData.id,price,
      title,address,photos:addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,
    });
    res.json(placeDoc);
  });
});
app.get('/places/:id', async (req,res) => {
  // mongoose.connect(process.env.MONGO_URL);
  const {id} = req.params;
  res.json(await Place.findById(id));
});

app.put('/places', async (req,res) => {
  // mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  const {
    id, title,address,addedPhotos,description,
    perks,extraInfo,checkIn,checkOut,maxGuests,price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,address,photos:addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,price,
      });
      await placeDoc.save();
      res.json('ok');
    }
  });
});

app.get('/user-places', (req,res) => {
  // mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const {id} = userData;
    res.json( await Place.find({owner:id}) );
  });
});
app.get('/places', async (req,res) => {
  // mongoose.connect(process.env.MONGO_URL);
  res.json( await Place.find() );
});

app.listen(8001);