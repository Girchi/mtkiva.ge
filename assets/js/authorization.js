(async () => {

    const response = await axios.get('/assets/js/auth_config.json');
    const FB_APP_ID = response.data.FB_APP_ID;
    const DRUPAL_DOMAIN = response.data.DRUPAL_DOMAIN;
    const axiosInstance = axios.create({ baseURL: DRUPAL_DOMAIN })

    if(localStorage.getItem('UserDetails') === 'undefined') localStorage.clear();

    // Set logged user credentials
    if(localStorage.getItem('UserDetails')){
        let userDetails = JSON.parse(localStorage.getItem('UserDetails'));

        try {

            const drupalResponse = await axiosInstance.get('/jsonapi/', { cache: 'no-cache', headers: { 'Authorization': userDetails.token } } );
            if(drupalResponse.status === 200) setData(userDetails)

        } catch (error) {
            if(error.response.status === 401){
            // Refresh token runs if access token is invalid
                try {
                    const serverResponse = await axios.get(`/authorization/refresh/${userDetails.refreshToken}&no&no`);
                    localStorage.setItem('UserDetails', JSON.stringify(serverResponse.data.localStore));
                    setData(serverResponse.data.localStore)
                    console.log('Storage refreshed')
                } catch (error) {
                    console.log('Refresh token may be expired')
                }
            } else {
                console.log('Unable to connect drupal')
            }
        }
    }

    // User facebook login event
    document.getElementById('loginBtn').addEventListener('click', facebookAuth)

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
                    console.log(accessToken, expirationTime, userID)

                    FB.api('/me/permissions', async (res) => {
                        const emailStatus = res.data.find(email => email.permission === 'email').status
                        if(emailStatus !== 'declined'){
                            console.log('Facebook SDK Works')
                            const serverResponse = await axios.get(`/authorization/fb/${accessToken}&${expirationTime}&${userID}`);
                            
                            if(serverResponse.status === 200 && serverResponse.data.localStore !== undefined){
                                setData(serverResponse.data.localStore)
                                localStorage.setItem('UserDetails', JSON.stringify(serverResponse.data.localStore))
                            } else if(serverResponse.status === 200) {
                                console.log('information cannot get properly from drupal')
                                console.log(serverResponse.data)
                            } else {
                                console.log('back side problem in authorization')
                                console.log(serverResponse.data)
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

        if(document.getElementById('loginBtn')) loginBtn.classList.add('disabled');
        if(document.getElementById('loginInfo')) loginInfo.classList.add('login-info-active');
        if(document.getElementById('logoutBtn')) logoutBtn.classList.add('logout-btn-active');
        if(document.getElementById('hiddenToken')) hiddenToken.value = localStore.token;

        logoutBtn.addEventListener('click', () => {
            window.localStorage.clear()            
            if(document.getElementById('loginBtn')) loginBtn.classList.remove('disabled');
            if(document.getElementById('loginInfo')) loginInfo.classList.remove('login-info-active');
            if(document.getElementById('logoutBtn')) logoutBtn.classList.remove('logout-btn-active');
            if(document.getElementById('hiddenToken')) hiddenToken.value = '';
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
    }

})()