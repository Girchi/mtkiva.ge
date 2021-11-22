import convertLetters from "/assets/js/convertLetters.js";

(async () => {

    const response = await axios.get('/assets/js/auth_config.json');
    const FB_APP_ID = response.data.FB_APP_ID;
    const DRUPAL_DOMAIN = response.data.DRUPAL_DOMAIN;
    const axiosInstance = axios.create({ baseURL: DRUPAL_DOMAIN })

    if(localStorage.getItem('UserDetails') === 'undefined') localStorage.clear();

    // Set logged user credentials
    if(localStorage.getItem('UserDetails')){
        let userDetails = JSON.parse(localStorage.getItem('UserDetails'));
        if(document.getElementById('loginBtn')) loginBtn.classList.add('disabled');

        try {
            loader.classList.add('loading');
            const drupalResponse = await axiosInstance.get('/jsonapi', { cache: 'no-cache', headers: { 'Authorization': userDetails.token } } );
            loader.classList.remove('loading');
            if(drupalResponse.status === 200) setData(userDetails)

        } catch (error) {
            if(error.response && error.response.status === 401){
            // Refresh token runs if access token is invalid
                try {
                    loader.classList.add('loading');
                    const serverResponse = await axios.get(`/authorization/refresh/${userDetails.refreshToken}&no&no`);
                    loader.classList.remove('loading');

                    localStorage.setItem('UserDetails', JSON.stringify(serverResponse.data.localStore));
                    setData(serverResponse.data.localStore)
                    console.log('Storage refreshed')
                } catch (error) {
                    console.log(error.message)
                    loader.classList.remove('loading');
                    loginBtn.classList.remove('disabled');
                    loginInfo.classList.remove('login-info-active');
                    logoutBtn.classList.remove('logout-btn-active');
                    window.localStorage.clear()       
                }
            } else {
                console.log(`Unable to connect drupal ${error}`)
                loader.classList.remove('loading');
                loginBtn.classList.remove('disabled');
                loginInfo.classList.remove('login-info-active');
                logoutBtn.classList.remove('logout-btn-active');
                window.localStorage.clear()            
            }
        }
    }

    // User facebook login event
    const loginButtons = document.getElementsByClassName('login-btn')
    for(let button of loginButtons){
        button.addEventListener('click', facebookAuth)
    }

    function facebookAuth(){

        window.fbAsyncInit = () => {
            FB.init({
            appId            : FB_APP_ID,
            autoLogAppEvents : true,
            xfbml            : true,
            version          : 'v11.0',
            });
        };

        let facebookSDK = document.createElement('script');
        facebookSDK.setAttribute('async', '');
        facebookSDK.setAttribute('defer', '');
        facebookSDK.setAttribute('crossorigin', 'anonymous');
        facebookSDK.src = "https://connect.facebook.net/en_US/sdk.js";
        document.head.appendChild(facebookSDK);

        facebookSDK.onload = () => {

            FB.login((response) => {

                if (response.status == 'connected') {

                    const accessToken = response.authResponse.accessToken;
                    const expirationTime = JSON.stringify(response.authResponse.data_access_expiration_time);
                    const userID = response.authResponse.userID;
                    console.log(`FB Access Token: ${accessToken}, FB Expiration Time: ${expirationTime}, FB User ID: ${userID}`)

                    FB.api('/me/permissions', async (res) => {
                        const emailStatus = res.data.find(email => email.permission === 'email').status
                        if(emailStatus !== 'declined'){
                            console.log('Facebook SDK Works')

                            let loader = document.getElementById('loader');

                            loader.classList.add('loading');
                            loginBtn.classList.add('disabled');

                            const serverResponse = await axios.get(`/authorization/fb/${accessToken}&${expirationTime}&${userID}`);
                            loader.classList.remove('loading');

                            if(serverResponse.status === 200 && serverResponse.data.localStore !== undefined){
                                setData(serverResponse.data.localStore)
                                localStorage.setItem('UserDetails', JSON.stringify(serverResponse.data.localStore))
                            } else if(serverResponse.status === 200) {
                                console.log('information cannot get properly from drupal')
                                console.log(serverResponse.data)
                                loginBtn.classList.remove('disabled');
                            } else {
                                console.log('back side problem in authorization')
                                console.log(serverResponse.data)
                                loginBtn.classList.remove('disabled');
                            }

                        } else {
                            console.log('please grant email and continue')
                        } 
                    });

                } else {
                    console.log('connection error')
                }
            }, {scope: 'email', auth_type: "rerequest"})
        }
    }

    // Sets user drupal data into page
    function setData(localStore){

        if(document.getElementById('loginInfo')) loginInfo.classList.add('login-info-active');
        if(document.getElementById('logoutBtn')) logoutBtn.classList.add('logout-btn-active');

        logoutBtn.addEventListener('click', () => {
            window.localStorage.clear()            
            if(document.getElementById('loginBtn')) loginBtn.classList.remove('disabled');
            if(document.getElementById('loginInfo')) loginInfo.classList.remove('login-info-active');
            if(document.getElementById('logoutBtn')) logoutBtn.classList.remove('logout-btn-active');
            if(document.getElementById('hiddenToken')) hiddenToken.value = '';

            if(document.getElementById('nameInput')) nameInput.value = '';
            if(document.getElementById('surnameInput')) surnameInput.value = '';
            if(document.getElementById('personalNumInput')) personalNumInput.value = '';
            if(document.getElementById('phoneNumInput')) phoneNumInput.value = '';
            if(document.getElementById('emailInput')) emailInput.value = '';

            
            // Handle Logout for Petition Page 
            if(document.getElementById('formPetition')){
                options.style.display = 'block';
                noAuthSign.appendChild(formPetition)
            }
        })

        let userName;
        if(localStore.userFirstName != null){
            userName = localStore.userFirstName;
        }
        if (localStore.userLastName != null) {
            userName += ' ' + localStore.userLastName
        } 
        if (localStore.userFirstName == null && localStore.userLastName == null){
            userName = localStore.userLoginName
        }

        loginInfo.innerHTML = `
        <img src="${localStore.userPicture}">
        <h4>${userName}</h4>
        `

        loginInfo.href = `/redirect/${localStore.drupalID}`


        // Handle CardForm
        if(document.getElementById('cardForm')){

            nameInput.value = userName;
            hiddenToken.value = localStore.token;
            idNumInput.value = localStore.userPersonalId;
            dateInput.value = localStore.userDateOfBirth;

            // const cardFullName = document.querySelectorAll("#cardFullName");
            // cardFullName[0].textContent = convertLetters(userName, 'geo');
            // cardFullName[1].textContent = convertLetters(userName);
            // cardIdNum.textContent = localStore.userPersonalId;
            // cardDate.textContent = localStore.userDateOfBirth;
        }


        // Handle Petition Page
        if(document.getElementById('formPetition')){

            petitionContainer.appendChild(formPetition)
            options.style.display = 'none';

            nameInput.value = localStore.userFirstName;
            surnameInput.value = localStore.userLastName;

            if(!localStore.userFirstName && !localStore.userLastName){
                nameInput.value = userName;
            }

            hiddenToken.value = localStore.token;
            personalNumInput.value = localStore.userPersonalId;
            phoneNumInput.value = localStore.userPhoneNumber;
            emailInput.value = localStore.userEmail;
        }
    }

})()