function convertLetters(str, lang) {
  let objectOfLetters = { ქ: "k", წ: "ts", ე: "e", რ: "r", ტ: "t", ყ: "k", უ: "u", ი: "i", ო: "o", პ: "p", ა: "a", ს: "s", დ: "d", ფ: "ph", გ: "g", ჰ: "h", ჯ: "j", 
                          კ: "k", ლ: "l", ზ: "z", ხ: "kh", ც: "ts", ვ: "v", ბ: "b", ნ: "n", მ: "m", ღ: "gh", თ: "t", შ: "sh", ჟ: "zh", ძ: "dz", ჩ: "ch", ჭ: "ch", 

                          q: "k", w: "ts", e: "e", r: "r", t: "t", y: "k", u: "u", i: "i", o: "o", p: "p", a: "a", s: "s", d: "d", f: "ph", g: "g", h: "h", j: "j", 
                          k: "k", l: "l", z: "z", x: "kh", c: "ts", v: "v", b: "b", n: "n", m: "m", R: "gh", T: "t", S: "sh", J: "zh", Z: "dz", C: "ch", W: "ch", "-":"-" };
  if(lang === 'geo') {
    objectOfLetters = { q: "ქ", w: "წ", e: "ე", r: "რ", t: "ტ", y: "ყ", u: "უ", i: "ი", o: "ო", p: "პ", a: "ა", s: "ს", d: "დ", f: "ფ", g: "გ", h: "ჰ", j: "ჯ",
                        k: "კ", l: "ლ", z: "ზ", x: "ხ", c: "ც", v: "ვ", b: "ბ", n: "ნ", m: "მ", R: "ღ", T: "თ", S: "შ", J: "ჟ", Z: "ძ", C: "ჩ", W: "ჭ", 

                        ქ: "ქ", წ: "წ", ე: "ე", რ: "რ", ტ: "ტ", ყ: "ყ", უ: "უ", ი: "ი", ო: "ო", პ: "პ", ა: "ა", ს: "ს", დ: "დ", ფ: "ფ", გ: "გ", ჰ: "ჰ", ჯ: "ჯ",
                        კ: "კ", ლ: "ლ", ზ: "ზ", ხ: "ხ", ც: "ც", ვ: "ვ", ბ: "ბ", ნ: "ნ", მ: "მ", ღ: "ღ", თ: "თ", შ: "შ", ჟ: "ჟ", ძ: "ძ", ჩ: "ჩ", ჭ: "ჭ", "-":"-" }; 
  }

  const words = str.split(' ')
  const convertedWords = words.map(word => word.split("")
    .map((letter) => objectOfLetters[letter])
    .join("")
  )

  return convertedWords.join(' ')
}

export default convertLetters;
