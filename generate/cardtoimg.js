import generateCardTemplateGe from "./cardtoimg-assets/generateFrontCardTemplate.js";
import generateCardTemplateEn from "./cardtoimg-assets/generateBackCardTemplate.js";
import nodeHtmlToImage from "node-html-to-image";
import * as fs from "fs";

import convertLetters from "../assets/js/convertLetters.js";
import statusChanger from "../assets/js/statusChanger.js";
import generateQR from "../assets/js/generateQR.js";


const cardtoimg = async (body) => {

  const QRValue = await generateQR(`https://mtkiva.ge/user/${body.id_number}`);
  const profileImg = imageEncoder(body.img)
  // const bgImg = imageEncoder('/assets/img/.png')
  // const bgImg2 = imageEncoder('/assets/img/card/.png')
  // const bgImg3 = imageEncoder('/assets/img/card/.png')

  // Create image elements for badges
  const badges = [statusChanger(body.status, 'class'), ...body.other_statuses.map(status => statusChanger(status, 'class'))];
  let badgeTags = '';
  badges.forEach(className => badgeTags += ` <img src="${imageEncoder(`/assets/img/card/${className}.png`)}" /> ` )

  await nodeHtmlToImage({
    output: `./generate/card-imgs/${body.card_number}-front.jpg`,
    html: generateCardTemplateGe(),
    content: {
      name: body.name,
      status: statusChanger(body.status, 'clean'),
      badgeTags, 
      profileImg,
      bgImg,
      bgImg2,
      bgImg3,
    },
  }).catch((err) => console.log(err));

  await nodeHtmlToImage({
    output: `./generate/card-imgs/${body.card_number}-back.jpg`,
    html: generateCardTemplateEn(),
    content: {
      card_number: body.card_number,
      id_number: body.id_number,
      birth_date: body.birth_date,
      registration: body.registration,

      name: convertLetters(body.name),
      status: statusChanger(body.status, 'lang'),
      QRValue,
      bgImg,
      bgImg2,
      bgImg3,
    },
  }).catch((err) => console.log(err));

  console.log(`User ${body.card_number} Card Created...`); 
  
}

const generateCards = async () => {

  const userBodies = fs.readdirSync("./database")
    .map(userJSON => JSON.parse(fs.readFileSync(`./database/${userJSON}`, 'utf8')))
    .sort((a, b) => a.card_number - b.card_number)

  for(let body of userBodies){
    const frontPath = `./generate/card-imgs/${body.card_number}-front.jpg`;
    const backPath = `./generate/card-imgs/${body.card_number}-back.jpg`;

    if (!fs.existsSync(frontPath) || !fs.existsSync(backPath)) {
      console.log(`Started Creating Card ${body.card_number}`)
      await cardtoimg(body)
    }

  }

}

function imageEncoder(img) {
  const cleanUrl = img.replace('/', './')
  let image = fs.readFileSync(cleanUrl);
  const base64Image = new Buffer.from(image).toString('base64');
  const dataURI = 'data:image/jpeg;base64,' + base64Image
  return dataURI
}


export default cardtoimg
