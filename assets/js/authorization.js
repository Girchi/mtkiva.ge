(async () => {
    const response = await axios.get('/assets/js/auth_config.json');
    const FB_APP_ID = response.data.FB_APP_ID;
    const DRUPAL_DOMAIN = response.data.DRUPAL_DOMAIN;
    const axiosInstance = axios.create({ baseURL: DRUPAL_DOMAIN })

    if(localStorage.getItem('UserDetails') === 'undefined'){
        window.localStorage.clear()            
        location.reload();
    } 

    let localStore = JSON.parse(localStorage.getItem('UserDetails'));
    // Set logged user credentials
    if(localStore){
        if(document.getElementById('loginBtn')) loginBtn.classList.add('disabled');
        if(document.getElementById('loginInfo')) loginInfo.classList.add('login-info-active');
        if(document.getElementById('logoutBtn')) logoutBtn.classList.add('logout-btn-active');
        if(document.getElementById('hiddenToken')) hiddenToken.value = localStore.token;

        try {
            const drupalResponse = await axiosInstance.get('/jsonapi', { cache: 'no-cache', headers: { 'Authorization': localStore.token } } );
            if(drupalResponse.status === 200) setData()
        } catch (error) {
            if(error.response.status === 401){
                try {
                    const serverResponse = await axios.get(`/authorization/refresh/${localStore.refreshToken}&no&no`);
                    localStorage.setItem('UserDetails', JSON.stringify(serverResponse.data.localStore));
                    localStore = JSON.parse(localStorage.getItem('UserDetails'));
                    setData()
                } catch (error) {
                    console.log('Refresh token may be expired')
                    window.localStorage.clear()            
                    location.reload();
                }
            } else {
                console.log('Unable to connect drupal')
                window.localStorage.clear()            
                location.reload();
            }
        }
    }

    function setData(){
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

        logoutBtn.addEventListener('click', () => {
            window.localStorage.clear()            
            location.reload();
        })
    }

    // User facebook login event
    document.getElementById('loginBtn').addEventListener('click', () => {

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

                    FB.api('/me/permissions', async (res) => {
                        const emailStatus = res.data.find(email => email.permission === 'email').status
                        if(emailStatus !== 'declined'){
                            const serverResponse = await axios.get(`/authorization/fb/${accessToken}&${expirationTime}&${userID}`);

                            localStorage.setItem('UserDetails', JSON.stringify(serverResponse.data.localStore))
                            location.reload();
                        } else {
                            console.log('please grant email and continue')
                        } 
                    });

                } else {
                    console.log('connection error')
                }
            }, {scope: 'email', auth_type: "rerequest"})
        }
    
    })

})()