const FB_APP_ID = '303239883689419';

// Set logged user credentials
const localStore = JSON.parse(localStorage.getItem('UserDetails'));
if(localStore){

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

    const loginBtn = document.getElementById('loginBtn');
    const loginInfo = document.getElementById('loginInfo');
    const logoutBtn = document.getElementById('logoutBtn');

    loginBtn.classList.add('disabled');
    loginInfo.classList.add('login-info-active')
    logoutBtn.classList.add('logout-btn-active')

    loginInfo.innerHTML = `
    <img src="${localStore.userImgPath}">
    <h4>${userName}</h4>
    `

    loginInfo.href = `/redirect/${localStore.drupalID}`

    logoutBtn.addEventListener('click', () => {
        window.localStorage.clear()            
        location.reload();
    })

    if(document.getElementById('joinBtn')) joinBtn.classList.add('disabled');
    if(document.getElementById('hiddenToken')) hiddenToken.value = localStore.token;
    
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

                        const serverConnect = await fetch(`/authorization/${accessToken}&${expirationTime}&${userID}`, { method: 'POST' });
                        const serverResponse = await serverConnect.json();

                        localStorage.setItem('UserDetails', JSON.stringify(serverResponse.localStore))
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