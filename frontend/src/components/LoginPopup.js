import '../static/NotSignedInPopup.css';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import React, { useState } from 'react';

function LoginPopup({ closePopup, BACKENDURL }) {
    const [, setCookie] = useCookies(['token']);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [usernameError, setUsernameError] = useState('')
    const [passwordError, setPasswordError] = useState('')

    function validate() {
        let usernameError = "";
        let passwordError = "";
        let valid = true;
        if (!username) {
            usernameError = "Username cannot be blank";
            valid = false;
        }
        if (!password) {
            passwordError = "Password cannot be blank";
            valid = false;
        }
        setUsernameError(usernameError);
        setPasswordError(passwordError);
        return valid;
    }

    function login() {
        if (validate()) {
            const body = JSON.stringify({
                username: username,
                password: password
            });
            axios.post(BACKENDURL.concat("/accounts/login/"), body, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                setCookie('token', response.data["access"], { path: '/' });
                // setRedirect(true);
            }).catch(error => {
                setPasswordError("Invalid username or password");
            });
        }
    }

    return (
        <>
            <div id="loginOverlay"></div>
            <div id="loginPopup">
                <h2 class="col-blue">Login</h2>

                {/* Close Popup */}
                <button id="closeButton" onClick={closePopup}><p>&times;</p></button>

                <div class="popupcontent">
                    <form>
                        <div class="col-blue">
                            <label class="form-label">Username</label>
                            <input
                                type="text"
                                class="form-control"
                                name="username"
                                onChange={(e) => setUsername(e.target.value)} />
                            <p class="errorLabel">{usernameError}</p>
                        </div>
                        <div class="col-blue">
                            <label class="form-label">Password</label>
                            <input
                                type="password"
                                class="form-control"
                                name="password"
                                onChange={(e) => setPassword(e.target.value)} />
                            <p class="errorLabel">{passwordError}</p>
                        </div>
                    </form>
                    <button type="submit" class="sub" onClick={login}>Log In</button>
                </div>
            </div>
        </>
    );
}

export default LoginPopup;