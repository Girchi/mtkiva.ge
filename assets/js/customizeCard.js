import convertLetters from "/assets/js/convertLetters.js";
import statusChanger from "/assets/js/statusChanger.js";

// Input assets for other statuses
$(document).ready(function(){
  let multipleCancelButton = new Choices('#multipleStatusInput', {
  removeItemButton: true,
  maxItemCount:7,
  searchResultLimit:8,
  renderChoiceLimit:8
  });
});


const cardForm = document.querySelector("#cardForm");
// const cardFullName = document.querySelectorAll("#cardFullName");
// const cardIdNum = document.querySelector("#cardIdNum");

// const cardDate = document.querySelector("#cardDate");
// const cardStatus = document.querySelectorAll("#cardStatus");
// const cardBadges = document.querySelector("#badges");

// Changes data on input with keyboard
function changeInputData() {
  // let nameValue = document.querySelector("#nameInput").value;
  // const idNumValue = document.querySelector("#idNumInput").value;

  // if (nameValue) {
  //   cardFullName[0].textContent = convertLetters(nameValue, 'geo');
  //   cardFullName[1].textContent = convertLetters(nameValue);
  // }
  // if (idNumValue) cardIdNum.textContent = idNumValue;
}

// Changes data on select item
function changeSelectData() {
  // const dateValue = document.querySelector("#dateInput").value;

  // const statusValue = document.querySelector("#statusInput").value;
  // const multipleStatuses = document.querySelectorAll('#multipleStatusInput option:checked');
  // const statusClass = statusChanger(statusValue, 'class');
  // const status = statusChanger(statusValue, 'clean');;
  // const statusEN = statusChanger(statusValue, 'lang');

  // cardBadges.innerHTML = `
  //   <img src="/assets/img/card/${statusClass}.png">
  // `;
  
  // multipleStatuses.forEach(status => {
  //   const statusClass = statusChanger(status.value, 'class');
  //   cardBadges.innerHTML += `
  //     <img src="/assets/img/card/${statusClass}.png">
  //   `
  // })

  // if (statusValue) {
  //   cardStatus[0].textContent = status;
  //   cardStatus[1].textContent = statusEN;
  // }
  // if (dateValue) cardDate.textContent = dateValue;
}

cardForm.addEventListener("keyup", changeInputData);
cardForm.addEventListener("change", changeSelectData);

// Import image on browser
const imageInput = document.getElementById("imageInput");
// const cardImage = document.querySelector("#cardImage");

imageInput.addEventListener("change", function () {
  // cardImage.src = URL.createObjectURL(this.files[0]);
})


// export { changeInputData, changeSelectData };
