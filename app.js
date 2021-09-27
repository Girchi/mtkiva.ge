import express from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as fs from "fs";
import bodyParser from "body-parser";
import multer from "multer";
import fetch from "node-fetch";
import https from "https";
import FormData from 'form-data';
import dotenv from "dotenv";
dotenv.config();
import sharp from "sharp";

// Grab Custom Functions
import convertLetters from "./assets/js/convertLetters.js";
import cardtoimg from "./generate/cardtoimg.js";
import generatepdf from "./generate/generatepdf.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.set("view engine", "pug");
app.use("/assets", express.static("assets"));
app.use("/generate", express.static("generate"));

// Local SSL Connection
// https.createServer({
//     key: fs.readFileSync(process.env.SSL_KEY),
//     cert: fs.readFileSync(process.env.SSL_CERT)
//   }, app).listen(8000);
// console.log(`Connection With SSH https://localhost:8000`)

app.listen(3000)
console.log(`Default Connection http://localhost:3000`)


// Home Page
app.get("/", (req, res) => {

  let isTokenExpired = req.query.param1 || false;

  const usersList = fs.readdirSync("./database")
  .map(userJSON => userJSON = JSON.parse(fs.readFileSync(`./database/${userJSON}`, 'utf8')))
  .sort((a, b) => b.card_number - a.card_number)
  .slice(0,6)

  res.render(__dirname + "/snippet/index", { usersList, isTokenExpired });

});


// All Users Page
app.get("/users", (req, res) => {
  
  const usersList = fs.readdirSync("./database")
  .map(userJSON => userJSON = JSON.parse(fs.readFileSync(`./database/${userJSON}`, 'utf8')))
  .sort((a, b) => b.card_number - a.card_number)

  res.render(__dirname + "/snippet/users", { usersList });

});


// User Inner Page
app.get("/user/:id", (req, res) => {
  try {
    const userData = JSON.parse(fs.readFileSync(`./database/${req.params.id}.json`, 'utf8'));
    res.render(__dirname + "/snippet/profile", { ...userData });
  } catch (error) {
    res.redirect(`/create-card`);
  }
});


// Redirect Into User Page
app.get("/redirect/:id", (req, res) => {
  try {
    const currUser = fs.readdirSync("./database")
    .find(user => JSON.parse(fs.readFileSync(`./database/${user}`, 'utf8')).drupal_id === req.params.id)
    .replace('.json','')
    res.redirect(`/user/${currUser}`)
  } catch (err) {
    res.redirect(`/create-card`);
  }
});


// User Data Input Page
app.get("/create-card", (req, res) => {
  const currentDate = new Date().toISOString().slice(0, 10);
  const currentCardNum = nextCardNum();

  res.render(__dirname + "/snippet/create-card", { currentCardNum, currentDate });
});


// User verify and save data
app.post( "/create-card", [urlencodedParser, upload.single("image")], async (req, res) => {
  try {
    const authConnect = await fetch(`${process.env.GIRCHI_DOMAIN}/jsonapi`, { cache: 'no-cache', headers: { 'Authorization': req.body.token } });
    const authResponse = await authConnect.json();

    if(authResponse.meta){
      const drupalID = authResponse.meta.links.me.meta.id;

      if(req.body.other_statuses == null) req.body.other_statuses = [];
      if(typeof req.body.other_statuses !== "object") req.body.other_statuses = [req.body.other_statuses];

      delete req.body.token;
      req.body.drupal_id = drupalID;
      req.body.img = `/assets/img/users-images/${req.file.originalname}`;
      req.body.name = convertLetters(req.body.name, 'geo');
      req.body.registration = new Date().toISOString().slice(0, 10);

      const userByIdNum = fs.existsSync(`./database/${req.body.id_number}.json`)
      const saveUser = async (details) => {
        await sharp(req.file.buffer).rotate().resize({width: 1000}).toFile(`./assets/img/users-images/${req.file.originalname}`);
        fs.writeFileSync(`./database/${details.id_number}.json`, JSON.stringify(details), err => { if(err) console.log(err) })
        res.redirect(`/user/${details.id_number}`);
        // cardtoimg(details)
      }

      if(userByIdNum){

        const userData = JSON.parse(fs.readFileSync(`./database/${req.body.id_number}.json`, 'utf8'));
        if(userData.drupal_id === drupalID){
          req.body.card_number = userData.card_number;
          saveUser(req.body)
        } else {
          console.log('id number already used')
          res.redirect('/create-card')
        }

      } else {

        fs.readdirSync("./database").filter(userJSON => {
          userJSON = JSON.parse(fs.readFileSync(`./database/${userJSON}`, 'utf8'));
          if(userJSON.drupal_id === drupalID) fs.unlink(`./database/${userJSON.id_number}.json`, (err) => console.log(err));
        })

        req.body.card_number = nextCardNum();
        saveUser(req.body)
      }

    } else {
      console.log(`Authorization Problems`)
      res.redirect('/?param1=expired')
    }

  } catch (err) {
    console.log(`error: ${err}`)
    res.redirect('/create-card')
  }
});


// User Authorization
app.post("/authorization/:accessToken&:expirationTime&:userID", async (req, res) => {

  const formData = new FormData()
  formData.append("grant_type", "facebook_login_grant");
  formData.append("client_id", process.env.CLIENT_ID);
  formData.append("client_secret", process.env.SECRET_KEY);
  formData.append("facebook_access_token", req.params.accessToken);
  formData.append("facebook_user_id", req.params.userID);
  formData.append("facebook_token_expires_in", req.params.expirationTime);

  try {
    // Get user information
    const fbConnect = await fetch(`${process.env.GIRCHI_DOMAIN}/oauth/token`, { method: 'POST', body: formData });
    const fbResponse = await fbConnect.json();
    const token = `Bearer ${fbResponse.access_token}`

    const authConnect = await fetch(`${process.env.GIRCHI_DOMAIN}/jsonapi`, { cache: 'no-cache', headers: { 'Authorization': token } });
    const authResponse = await authConnect.json();

    const drupalID = authResponse.meta.links.me.meta.id
    const userPath = authResponse.meta.links.me.href

    const userData = await fetch(userPath, { cache: 'no-cache', headers: { 'Authorization': token } });
    const userDataRes = await userData.json();

    const userLoginName = userDataRes.data.attributes.name
    const userFirstName = userDataRes.data.attributes.field_first_name
    const userLastName = userDataRes.data.attributes.field_last_name
    const userImgLocation = userDataRes.data.relationships.user_picture.links.related.href

    const userImg = await fetch(userImgLocation, { cache: 'no-cache', headers: { 'Authorization': token } });
    const userImgRes = await userImg.json();

    let userImgPath = userImgRes.data ?
    `${process.env.GIRCHI_DOMAIN}${userImgRes.data.attributes.uri.url}` :
    `/assets/img/avatar.png`;

    const localStore = { token, drupalID, userImgPath, userFirstName, userLastName, userLoginName }

    res.send({localStore})   

  } catch (err) {
    console.log(`error: ${err}`)
    res.redirect('/')
  }
});


// Countitution Page
app.get("/constitution", (req, res) => {
  res.render(__dirname + "/snippet/constitution");
});


// Download PDFs Page
app.get("/cards-download", (req, res) => {

  let important = [], staff = [], users = [];

  fs.readdirSync("generate/pdf").forEach(PDF => {
    const firstDocumentValue = parseInt(PDF.split('-')[0].replace('.pdf',''));
    firstDocumentValue < 10 ? important.push(PDF) : 
    firstDocumentValue < 1000 ? staff.push(PDF) : users.push(PDF);
  })

  res.render(__dirname + "/snippet/card-download", { important, staff, users });

});


app.post("/cards-download", (req, res) => {

  generatepdf().then(() => {
    res.redirect("/cards-download",);
  }).catch(err => console.log(err))

});


// Define unused card number
function nextCardNum(priority) {

  let mostReservedCards = [];
  let reservedCards = [];
  let otherCards = [];

  fs.readdirSync("./database").forEach(user => {
    user = JSON.parse(fs.readFileSync(`./database/${user}`, 'utf8'))
    if(Number(user.card_number) <= 10){
      mostReservedCards.push(user.card_number);
    } else if(Number(user.card_number) <= 1000) {
      reservedCards.push(user.card_number);
    } else if(Number(user.card_number) > 1000) {
      otherCards.push(user.card_number)
    }
  })

  mostReservedCards.sort((a, b) => b - a);
  reservedCards.sort((a, b) => b - a);
  otherCards.sort((a, b) => b - a);

  let nextCardNum;

  if(priority == 1) {
    nextCardNum = Number(mostReservedCards[0]) + 1 || 1;
  } else if(priority == 2) {
    nextCardNum = Number(reservedCards[0]) + 1 || 11;
  } else {
    nextCardNum = Number(otherCards[0]) + 1 || 1001;
  }

  return JSON.stringify(nextCardNum).padStart(4, '0')
}