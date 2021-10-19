import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as fs from 'fs';
import bodyParser from 'body-parser';
import multer from 'multer';
import axios from 'axios';
import https from 'https';
import FormData from 'form-data';
import dotenv from 'dotenv';
import sharp from 'sharp';

// Grab Custom Functions
import convertLetters from './assets/js/convertLetters.js';
import cardtoimg from './generate/cardtoimg.js';
import generatepdf from './generate/generatepdf.js';

const storage = multer.memoryStorage();
const upload = multer({ storage });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const axiosInstance = axios.create({ baseURL: process.env.DRUPAL_DOMAIN });

const app = express();
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.set('view engine', 'pug');
app.use('/assets', express.static('assets'));
app.use('/generate', express.static('generate'));

// Local SSL Connection
// https.createServer({
//     key: fs.readFileSync(process.env.SSL_KEY),
//     cert: fs.readFileSync(process.env.SSL_CERT)
//   }, app).listen(8000);
// console.log(`Connection With SSH https://localhost:8000`)

app.listen(3000);
console.log(`Default Connection http://localhost:3000`);

// Home Page
app.get('/', (req, res) => {
	const usersList = fs
		.readdirSync('./database')
		.map((userJSON) => (userJSON = JSON.parse(fs.readFileSync(`./database/${userJSON}`, 'utf8'))))
		.sort((a, b) => b.card_number - a.card_number)
		.slice(0, 6);

	res.render(__dirname + '/snippet/index', { usersList });
});

// All Users Page
app.get('/users', (req, res) => {
	const usersList = fs
		.readdirSync('./database')
		.map((userJSON) => (userJSON = JSON.parse(fs.readFileSync(`./database/${userJSON}`, 'utf8'))))
		.sort((a, b) => b.card_number - a.card_number);

	res.render(__dirname + '/snippet/users', { usersList });
});

// User Inner Page
app.get('/user/:id', (req, res) => {
	try {
		const userData = JSON.parse(fs.readFileSync(`./database/${req.params.id}.json`, 'utf8'));
		res.render(__dirname + '/snippet/profile', { ...userData });
	} catch (error) {
		res.redirect(`/create-card`);
	}
});

// Redirect Into User Page
app.get('/redirect/:id', (req, res) => {
	try {
		const currUser = fs
			.readdirSync('./database')
			.find((user) => JSON.parse(fs.readFileSync(`./database/${user}`, 'utf8')).drupal_id === req.params.id)
			.replace('.json', '');
		res.redirect(`/user/${currUser}`);
	} catch (err) {
		res.redirect(`/create-card`);
	}
});

// User Data Input Page
app.get('/create-card', (req, res) => {
	const currentDate = new Date().toISOString().slice(0, 10);
	const currentCardNum = nextCardNum();

	res.render(__dirname + '/snippet/create-card', { currentCardNum, currentDate });
});

// User verify and save data
app.post( "/create-card", [urlencodedParser, upload.single("image")], async (req, res) => {

  axiosInstance.get('/jsonapi', { cache: 'no-cache', headers: { 'Authorization': req.body.token } } )
  .then((response) => {
    // If user is logged successfully
    if(response && response.data.meta){

      if(req.body.other_statuses == null) req.body.other_statuses = [];
      if(typeof req.body.other_statuses !== "object") req.body.other_statuses = [req.body.other_statuses];

      const fullName = convertLetters(req.body.name, 'geo').trim().split(/[ ]+/gi);
      const idNumTaken = fs.existsSync(`./database/${req.body.id_number}.json`);

      req.body.drupal_id = response.data.meta.links.me.meta.id;
      req.body.img = `/assets/img/users-images/${req.file.originalname}`;
      req.body.name = fullName.join(" ");
      req.body.registration = new Date().toISOString().slice(0, 10);
    
      async function userSaveToDrupal(details, firstName, lastName) {
        // Save user into drupal base
        try {
          const config = {
            headers: {
              "Content-Type": "application/vnd.api+json",
              "Accept": "application/vnd.api+json",
              'Authorization': details.token,
            }
          };
          const body = {
            data: {
                type: "user--user",
                id: details.drupal_id,
                attributes: {
                    field_first_name: firstName,
                    field_last_name: lastName,
                    field_personal_id: details.id_number,
                    field_date_of_birth: details.birth_date,
                }
            }
          };
          await axiosInstance.patch(`/jsonapi/user/user/${details.drupal_id}`, body, config );
        } catch (err) {
          console.log(err.message)
        }
      }

      async function userSaveToServer(details) {
        // Save user to Server
        try {
          // Optimize image before save
          await sharp(req.file.buffer).rotate()
          .resize({width: 1000})
          .toFile(`./assets/img/users-images/${req.file.originalname}`);

          delete details.token;
          fs.writeFileSync(`./database/${details.id_number}.json`, JSON.stringify(details), err => { if(err) console.log(err) })
          
          // Create card image
          // cardtoimg(details)

          res.redirect(`/user/${details.id_number}`);
        } catch (err) {
          console.log(err)
        }
      }

      // If id number already exists on server
      if(idNumTaken){

        const userData = JSON.parse(fs.readFileSync(`./database/${req.body.id_number}.json`, 'utf8'));
        if(userData.drupal_id === req.body.drupal_id || userData.drupal_id === ''){
          req.body.card_number = userData.card_number;
          userSaveToDrupal(req.body, fullName[0], fullName[fullName.length - 1]);
          userSaveToServer(req.body);
        } else {
          console.log(`${req.body.drupal_id} is trying to use Personal ID ${req.body.id_number} that is already in use`)
          res.redirect('back')
        }
  
      } else {
        // Delete past user info file on server
        fs.readdirSync("./database").filter(userJSON => {
          userJSON = JSON.parse(fs.readFileSync(`./database/${userJSON}`, 'utf8'));
          if(userJSON.drupal_id === req.body.drupal_id) fs.unlink(`./database/${userJSON.id_number}.json`, (err) => console.log(err));
        });
        req.body.card_number = nextCardNum();
        userSaveToDrupal(req.body, fullName[0], fullName[fullName.length - 1]);
        userSaveToServer(req.body);
      }
    } else {
      // If user is not logged successfully
      console.log('meta information is not included')
      res.redirect('back');
    }
  })
  .catch((err) => {
    if(err.response.status === 401){
      console.log('access token is invalid')
      res.redirect('back');
    }
  })
});

// User Authorization
app.get("/authorization/:authType/:token&:expirationTime&:userID", async (req, res) => {

  const formData = new FormData()

  switch (req.params.authType) {
    case 'fb':
      formData.append("grant_type", "facebook_login_grant");
      formData.append("facebook_access_token", req.params.token);
      formData.append("facebook_user_id", req.params.userID);
      formData.append("facebook_token_expires_in", req.params.expirationTime);
      break;
    case 'refresh':
      formData.append("grant_type", "refresh_token");
      formData.append("refresh_token", req.params.token);
      break;
    default:
      console.log(req.params.authType);
  } 

  formData.append("client_id", process.env.CLIENT_ID);
  formData.append("client_secret", process.env.SECRET_KEY);
  
  try {
    // Get user information
    const oauthTokens = await axiosInstance.post('/oauth/token', formData, { headers: formData.getHeaders() } );
    const token = `Bearer ${oauthTokens.data.access_token}`;

    const drupalResponse = await axiosInstance.get('/jsonapi', { cache: 'no-cache', headers: { 'Authorization': token } } );

    const drupalID = drupalResponse.data.meta.links.me.meta.id

    const userResponse = await axiosInstance.get(`/jsonapi/user/user/${drupalID}`, { cache: 'no-cache', headers: { 'Authorization': token } } );
    const userPictureResponse = await axiosInstance.get(`/jsonapi/user/user/${drupalID}/user_picture`, { cache: 'no-cache', headers: { 'Authorization': token } } );

    const localStore = {
      token: `Bearer ${oauthTokens.data.access_token}`,
      refreshToken: oauthTokens.data.refresh_token,
      drupalID: drupalResponse.data.meta.links.me.meta.id,
      userLoginName: userResponse.data.data.attributes.name,
      userFirstName: userResponse.data.data.attributes.field_first_name,
      userLastName: userResponse.data.data.attributes.field_last_name,
      userDateOfBirth: userResponse.data.data.attributes.field_date_of_birth,
      userPersonalId: userResponse.data.data.attributes.field_personal_id,
      userPicture: userPictureResponse.data.data ? process.env.DRUPAL_DOMAIN + userPictureResponse.data.data.attributes.uri.url : `/assets/img/avatar.png`,

    }

    res.send({localStore})   

  } catch (error) {
    console.log(error.message)
    res.send(error.message)
  }
});

// Countitution Page
app.get('/constitution', (req, res) => {
	res.render(__dirname + '/snippet/constitution');
});

// Download PDFs Page
app.get('/cards-download', (req, res) => {
	let important = [],
		staff = [],
		users = [];

	fs.readdirSync('generate/pdf').forEach((PDF) => {
		const firstDocumentValue = parseInt(PDF.split('-')[0].replace('.pdf', ''));
		firstDocumentValue < 10 ? important.push(PDF) : firstDocumentValue < 1000 ? staff.push(PDF) : users.push(PDF);
	});

	res.render(__dirname + '/snippet/card-download', { important, staff, users });
});

app.post('/cards-download', (req, res) => {
	generatepdf()
		.then(() => {
			res.redirect('/cards-download');
		})
		.catch((err) => console.log(err));
});

// Define unused card number
function nextCardNum(priority) {
	let mostReservedCards = [];
	let reservedCards = [];
	let otherCards = [];

	fs.readdirSync('./database').forEach((user) => {
		user = JSON.parse(fs.readFileSync(`./database/${user}`, 'utf8'));
		if (Number(user.card_number) <= 10) {
			mostReservedCards.push(user.card_number);
		} else if (Number(user.card_number) <= 1000) {
			reservedCards.push(user.card_number);
		} else if (Number(user.card_number) > 1000) {
			otherCards.push(user.card_number);
		}
	});

	mostReservedCards.sort((a, b) => b - a);
	reservedCards.sort((a, b) => b - a);
	otherCards.sort((a, b) => b - a);

	let nextCardNum;

	if (priority == 1) {
		nextCardNum = Number(mostReservedCards[0]) + 1 || 1;
	} else if (priority == 2) {
		nextCardNum = Number(reservedCards[0]) + 1 || 11;
	} else {
		nextCardNum = Number(otherCards[0]) + 1 || 1001;
	}

	return JSON.stringify(nextCardNum).padStart(4, '0');
}

(function makeImportantDirectories(){
  if(!fs.existsSync('./database')){
    fs.mkdirSync('./database');
  };
  if(!fs.existsSync('./assets/img/users-images')){
    fs.mkdirSync('./assets/img/users-images');
  };
  if(!fs.existsSync('./generate/card-imgs')){
    fs.mkdirSync('./generate/card-imgs');
  };
  if(!fs.existsSync('./generate/pdf')){
    fs.mkdirSync('./generate/pdf');
  };
})()