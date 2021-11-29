if (localStorage.getItem('UserDetails')) {
   authItem.style.display = 'none';
   signHeading.innerText = 'ხელმოწერა'
}

// Grab Petitions Part
window.onload = () => getPetitions();

loadBtn.onclick = () => {
   loadBtn.style.display = 'none';
   getPetitions()
}

let submissionCount = 0, usedIdNumbers = [];
async function getPetitions() {
   const domains = await axios.get('/assets/js/auth_config.json');
   const axiosInstance = axios.create({
      baseURL: domains.data.DRUPAL_DOMAIN
   })

   const { data: { data } } = await axiosInstance.get(`/jsonapi/webform_submission/mtkiva_ge_pettition_form?sort=-created&page[offset]=${submissionCount}&page[limit]=20`, {
      headers: {
         "pragma": "no-cache",
         "cache-control": "no-cache"
      },
   })

   submissionCount += data.length;

   let fetchedData = '';
   for (const submission of data) {
      const { data: { data } } = await axiosInstance.get(`/webform_rest/mtkiva_ge_pettition_form/submission/${submission.id}`)
      
      console.log(await axiosInstance.get(`/webform_rest/mtkiva_ge_pettition_form/submission/${submission.id}`));
      usedIdNumbers.push(data.personal_number);
      fetchedData += `<li>${data.name} ${data.surname}</li>`
   }
   petitionList.innerHTML += fetchedData;

   if (data.length === 20) loadBtn.style.display = 'inline-block';
}


// Petition Send Part
formPetition.onsubmit = (e) => { sendPetition(e) }

const formDiv = document.querySelector(".form-container");
async function sendPetition(e) {
   e.preventDefault();

   let idNumInput = document.querySelector("#personalNumInput").value;
   const hasUniqueId = usedIdNumbers.includes(idNumInput); // Returns true if the inputed ID isn't unique
   const domains = await axios.get('assets/js/auth_config.json');
   const axiosInstance = axios.create({ baseURL: domains.data.DRUPAL_DOMAIN }) 

   if(!hasUniqueId) {
      try {
         const accessToken = localStorage.getItem('UserDetails') !== null ? JSON.parse(localStorage.getItem('UserDetails')).token : ""
         const sessionToken = await axiosInstance.get(`/session/token`);

         const config = {
            headers: {
            "Content-Type": "application/json",
            "Authorization": accessToken,
            "X-CSRF-Token": sessionToken.data
            }
         };
         const body = {
            "webform_id": "mtkiva_ge_pettition_form",
            "name": nameInput.value,
            "surname": surnameInput.value,
            "email": emailInput.value,
            "personal_number": personalNumInput.value,
            "phone_number": phoneNumInput.value
         };
         const response = await axiosInstance.post(`/webform_rest/submit`, body, config);
         if (response.status === 200) {
            setSuccessMsg()
            petitionList.innerHTML = ''
            submissionCount = 0
            getPetitions()
         }
         formDiv.remove(); // Hide form container elements except success/error message
      } catch (error) {
         if (error) {
            setDeniedMsg()
            console.log(error);
         }
      }
   } else {
      alert("ამ პირადი ნომრით პეტიციაზე უკვე მოწერილი გაქვთ ხელი");
   }
}

const setSuccessMsg = () => successMessage.classList.add('show');

const setDeniedMsg = () => deniedMessage.classList.add('show');
