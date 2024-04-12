const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User.js");
const Place = require("./models/Model.js");
const Booking = require("./models/Booking.js");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");

require("dotenv").config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "eyJhbGciOiJ";

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

mongoose.connect(process.env.MONGO_URL);

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.get("/test", (req, res) => {
  res.send("Hello World!");
});
//U5nKlF1Z1gCVnuB0
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });

    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign(
          {
            email: userDoc.email,
            id: userDoc._id,
          },
          jwtSecret,
          {},
          (err, token) => {
            if (err) throw err;
            res.cookie("token", token).json(userDoc);
          }
        );
      } else {
        res.status(422).json("wrong password");
      }
    } else {
      res.json("not found");
    }
  } catch (e) {
    console.log("/login");
    res.status(500).json(e);
  }
});

app.get("/profile", (req, res) => {
  try {
    const { token } = req.cookies;
    if (token) {
      jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const { name, email, _id } = await User.findById(userData.id);
        res.json({ name, email, _id });
      });
    } else {
      res.json(null);
    }
  } catch (e) {
    console.log("/profile");
    res.status(500).json(e);
  }
});

app.post("/logout", (req, res) => {
  try {
    res.cookie("token", "").json(true);
  } catch (e) {
    console.log("/logout");
    res.status(500).json(e);
  }
});

app.post("/upload-by-link", async (req, res) => {
  try {
    const { link } = req.body;
    console.log(link);
    const newName = "photo" + Date.now() + ".jpg";
    await imageDownloader.image({
      url: link,
      dest: __dirname + "/uploads/" + newName,
    });
    res.json(newName);
  } catch (e) {
    console.log("/upload-by-link");
    res.status(500).json(e);
  }
});

const photosMiddleware = multer({ dest: "uploads" });
app.post("/upload", photosMiddleware.array("photos", 100), (req, res) => {
  try {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
      const { path, originalname } = req.files[i];
      const parts = originalname.split(".");
      const ext = parts[parts.length - 1];
      const newPath = path + "." + ext;
      fs.renameSync(path, newPath);
      uploadedFiles.push(newPath.replace("uploads", ""));
    }
    res.json(uploadedFiles);
  } catch (e) {
    console.log("/upload");
    res.status(500).json(e);
  }
});

app.post("/places", (req, res) => {
  try {
    const { token } = req.cookies;
    const {
      title,
      address,
      addedPhotos,
      description,
      perks,
      checkIn,
      checkOut,
      MaxGuests,
      price,
    } = req.body;
    
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.create({
        owner: userData.id,
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        checkIn,
        checkOut,
        maxGuests: MaxGuests,
        price,
      });
      res.json(placeDoc);
      console.log(placeDoc);
    });
  } catch (e) {
    console.log("/places");
    res.status(500).json(e);
  }
});

app.get("/user-places", (req, res) => {
  try {
    const { token } = req.cookies;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      const { id } = userData;
      res.json(await Place.find({ owner: id }));
    });
  } catch (e) {
    console.log("/user-places");
    res.status(500).json(e);
  }
});

app.get("/places/:id", async (req, res) => {
  try {
    const { id } = req.params;
    res.json(await Place.findById(id));
  } catch (e) {
    console.log("/places/:id");
    res.status(500).json(e);
  }
});

app.put("/places", async (req, res) => {
  try {
    const { token } = req.cookies;
    const {
      id,
      title,
      address,
      addedPhotos,
      description,
      perks,
      checkIn,
      checkOut,
      MaxGuests,
      price,
    } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.findById(id);
      if (userData.id === placeDoc.owner.toString()) {
        placeDoc.set({
          title,
          address,
          photos: addedPhotos,
          description,
          perks,
          checkIn,
          checkOut,
          maxGuests: MaxGuests,
          price,
        });
        await placeDoc.save();
        res.json("ok");
      }
    });
  } catch (e) {
    console.log("/places");
    res.status(500).json(e);
  }
});

app.get("/places", async (req, res) => {
  try {
    res.json(await Place.find());
  } catch (e) {
    console.log("/places");
    res.status(500).json(e);
  }
});

app.post("/bookings", async (req, res) => {
  const userData = await getUserDataFromReq(req);
  const { place, checkIn, checkOut, numberOfGuests, name, phone, price } =
    req.body;
  Booking.create({
    place,
    checkIn,
    checkOut,
    numberOfGuests,
    name,
    phone,
    price,
    user: userData.id,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      console.log("/bookings");
      throw err;
    });
});

app.get("/bookings", async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    res.json(await Booking.find({ user: userData.id }).populate("place"));
  } catch (e) {
    console.log("/bookings");
    res.status(500).json(e);
  }
});

app.listen(3000);
// app.listen(`https://bookingapp-r8rw.onrender.com`);
