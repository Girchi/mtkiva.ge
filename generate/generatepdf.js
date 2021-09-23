import { PDFDocument, degrees } from "pdf-lib";
import * as fs from "fs";
import isCorrupted from 'is-corrupted-jpeg';

// --Generate PDFs--
const generatepdf = async () => {
try {
  fs.readdirSync("./generate/pdf").forEach(file => { 
    if(file != ".gitkeep") fs.unlink(`./generate/pdf/${file}`, err => { if (err) throw err; }); 
  })

  let leftCards = leftCardNums();
  
  while(leftCards.length / 5 > 0){

    // Create document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    // Set parameters
    let parameters = { 
      sizes: {
        bgWidth: 595.44,
        bgHeight: 841.92,
        cardWidth: 163.6,
        cardHeight: 257.76,
      },
      positions: {
        offsetY: 177.5,
        frontPosX: 286.5,
        backPosX: 309,
        decValueY: 162.5,
        offsetYBack: 163,
      },
      orientations: {
        frontDegree: 90,
        backDegree: -90,
      }
    }, jpgImageBytes, jpgImage;

    // Set background into document
    jpgImageBytes = fs.readFileSync('./generate/bg.jpg');
    jpgImage = await pdfDoc.embedJpg(jpgImageBytes);
    page.drawImage(jpgImage, {
      x: 0,
      y: page.getHeight() - parameters.sizes.bgHeight,
      width: parameters.sizes.bgWidth,
      height: parameters.sizes.bgHeight,
    });

    // Fill with user card images
    let positionY = page.getHeight() - parameters.positions.offsetY;
    let pdfName = ''

    for (let j = 0; j < 5; j++) {
      const frontPath = `./generate/card-imgs/${leftCards[j]}-front.jpg`;
      const backPath = `./generate/card-imgs/${leftCards[j]}-back.jpg`;
      const existImages = fs.existsSync(frontPath) && fs.existsSync(backPath);

      let requirement = '';

      parseInt(leftCards[0]) <= 10 ? requirement = parseInt(leftCards[j]) <= 10 : 
      parseInt(leftCards[0]) <= 1000 ? requirement = parseInt(leftCards[j]) <= 1000 : 
      requirement = parseInt(leftCards[j]) > 1000;
    
      if (existImages && requirement) {
        // Set card front side into document
        jpgImageBytes = fs.readFileSync(frontPath);
        jpgImage = await pdfDoc.embedJpg(jpgImageBytes);
        page.drawImage(jpgImage, {
          x: parameters.positions.frontPosX,
          y: positionY,
          width: parameters.sizes.cardWidth,
          height: parameters.sizes.cardHeight + 1.5,
          rotate: degrees(parameters.orientations.frontDegree),
        }); 

        // Set card back side into document
        jpgImageBytes = fs.readFileSync(backPath);
        jpgImage = await pdfDoc.embedJpg(jpgImageBytes);
        page.drawImage(jpgImage, {
          x: parameters.positions.backPosX,
          y: positionY + parameters.positions.offsetYBack,
          width: parameters.sizes.cardWidth,
          height: parameters.sizes.cardHeight,
          rotate: degrees(parameters.orientations.backDegree),
        });

        // Y position changes when one image 
        positionY -= parameters.positions.decValueY;

        pdfName = pdfName + '-' + leftCards[j];

      }
    }

    // Save document into directory
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(`./generate/pdf/${pdfName.replace('-','')}.pdf`, pdfBytes, (err) => { 
      if (err) throw err;
      console.log(`PDF ${pdfName.replace('-','')} Created`)
    })

    leftCards = leftCardNums()     
  }
} catch (err) {
  console.log(err)
}
}

function leftCardNums() {

  const databaseCards = fs.readdirSync("./generate/card-imgs")
  .filter(card => !isCorrupted(`./generate/card-imgs/${card}`))
  .map(card => card.replace('-front.jpg','').replace('-back.jpg',''))

  let unDublicate = [];

  for(let card of databaseCards){
    const frontPath = `./generate/card-imgs/${card}-front.jpg`;
    const backPath = `./generate/card-imgs/${card}-back.jpg`;
    const existImages = fs.existsSync(frontPath) && fs.existsSync(backPath);
    
    if(existImages && !unDublicate.includes(card)){
      unDublicate.push(card)
    }
  }

  const directory = fs.readdirSync("./generate/pdf")
  let directoryCards = []

  for(let document of directory){
    document = document.replace('.pdf', '').split('-');
    for(let cardNum of document){
      directoryCards.push(cardNum)
    }
  }

  const leftCards = unDublicate.filter(baseCard => !directoryCards.find(dirCard => dirCard == baseCard))
  return leftCards;

}


export default generatepdf;