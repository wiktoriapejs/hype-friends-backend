const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');

const User = require('./models/User.js');
const Item = require('./models/Item.js')
const Booking = require('./models/Booking.js')

// const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');

mongoose.set('strictQuery', false);
require('dotenv').config();
const app = express();


const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';
const crypto = require('crypto');
// const secret = crypto.randomBytes(64).toString('hex');
// const bucket = 'wiktoria-booking-app';



app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173' ,
    optionsSuccessStatus: 200,
}));




// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});





//mongoose.connect(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  writeConcern: { w: "majority" }
});



app.get('/test', (req,res) => {
  res.json('test ok');
})


  app.post('/register', async (req,res) => {
    const {firstname,lastname, username, email,password} = req.body;

     try {
      const userDoc = await User.create({
        firstname,
        lastname,
        username,
        email,
        password:bcrypt.hashSync(password, bcryptSalt),
      });
      res.json(userDoc);
     } catch (e) {
       res.status(422).json(e);
     }
  
  });




  app.post('/login', async (req, res) => {
    
      const { username, password } = req.body;
      const userDoc = await User.findOne({ username });
      if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
          console.log('Password is correct');
         jwt.sign(
            {
              username: userDoc.username,
              id: userDoc._id,
              firstname: userDoc.firstname,
              lastname: userDoc.lastname,
              password: userDoc.password,
              email: userDoc.email

      
            },
           
          jwtSecret, {}, (_err,token) => 
          {
            res.cookie('token', token).json(userDoc);
            console.log(token);
          }
          );
          
        } else {
          res.status(401).json('Incorrect password');
        }
      } else {
        res.status(404).json('User not found');
      }
        
  });
  
  app.get('/profile', (req,res) => {
    const {token} = req.cookies;
    if (token) {                                   // user=> userData
      jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        // const {username,_id} =
         await User.findById(userData.id);
        // res.json({username,_id});
        res.json(userData)
      });
    } else {
      res.json(null);
    }
  });


  

  app.post('/logout', (req,res) => {

    res.cookie('token', '').json(true);
  })


  const photosMiddleware = multer({dest: 'uploads'});
  app.post('/upload', photosMiddleware.array('photos', 10), (req, res) => {
    
    const uploadedFiles = [];
    for(let i=0; i< req.files.length; i++)
    {
      const {path, originalname} = req.files[i];
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      const newPath = path + '.' + ext;
      fs.renameSync(path, newPath)
      uploadedFiles.push(newPath.replace('uploads/', ''))
    }
    res.json(uploadedFiles);
    console.log('ok');

  })

  app.post('/items', (req, res) => {
    const {token} = req.cookies;
    const {title, 
          addedPhotos, 
          description, 
          category, 
          brand, 
          price, 
          discount } = req.body
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;

    const itemDoc = await Item.create({
      owner: userData.id,
      photos: addedPhotos,
      title, 
      description, 
      category, 
      brand,  
      price, 
      discount,

    });

    res.json(itemDoc)
  })
});

app.get('/items', (req, res) => {
  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const {id} = userData;
    res.json(await Item.find({owner:id}))
  })

})


app.get('/items/:id', async (req,res) => {
  const {id} = req.params;
  res.json(await Item.findById(id));
});


app.put('/items/:id' , async(req,res) => {
  const {token} = req.cookies;
  const {id, title, 
        addedPhotos, 
        description, 
        category, 
        brand, 
        price, 
        discount } = req.body;
jwt.verify(token, jwtSecret, {}, async (err, userData) => {
  if (err) throw err;
  const itemDoc = await Item.findById(id);
  if(userData.id === itemDoc.owner.toString()){
    console.log('owner found')
    itemDoc.set({
      photos: addedPhotos,
      title, 
      description, 
      category, 
      brand,  
      price, 
      discount,
    })
    await itemDoc.save();
    res.json('updated')
  }
})

})

app.get('/rent', async (req, res) =>{
  res.json(await Item.find());
})

app.get('/rent/:id', async (req, res) =>{
  const {id} = req.params;
  res.json(await Item.findById(id));
})


app.post('/bookings', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const {
      item,
      from,
      to,
      address,
      name,
      cardNumber,
      cvv,
      price,
    } = req.body



    const itemBooking = await Booking.create({
      item,
      from,
      to,
      address,
      name,
      cardNumber,
      cvv,
      price,
      user: userData.id,
    });

    res.status(200).json(itemBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error booking item" });
  }
});


function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

  
  app.get('/bookings', async (req,res) => {
   const userData = await getUserDataFromReq(req);
     res.json( await Booking.find({user:userData.id}).populate('item') );
 });



 app.listen(4000);
