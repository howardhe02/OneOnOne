import '../static/NotSignedInPopup.css';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import React, { useState } from 'react';

function RegisterPopup({ closePopup, BACKENDURL }) {
    const [, setCookie] = useCookies(['token']);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");
    const [terms, setTerms] = useState(false);

    const [usernameError, setUsernameError] = useState('');
    const [password1Error, setPassword1Error] = useState('');
    const [password2Error, setPassword2Error] = useState('');
    const [emailError, setEmailError] = useState('');
    const [firstNameError, setfirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [termsError, setTermsError] = useState('');

    function validate() {
        let usernameError = "";
        let emailError = "";
        let firstNameError = "";
        let lastNameError = "";
        let password1Error = "";
        let password2Error = "";
        let termsError = "";
        let valid = true;
        if (username.length < 6) {
            usernameError = "Username must be at least 6 characters";
            valid = false;
        } else if (!/^[a-zA-Z0-9_]{6,}$/.test(username)) {
            usernameError = "Only letters, numbers, and underscores allowed";
            valid = false;
        }

        var email_regex = /^[a-zA-Z0-9._\-!%+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+$/;
        if ((!email_regex.test(email)) || /\.\./.test(email)) {
            emailError = "Invalid email address";
            valid = false;
        }

        if (!firstName) {
            firstNameError = "First name cannot be blank";
            valid = false;
        }

        if (!lastName) {
            lastNameError = "Last name cannot be blank";
            valid = false;
        }

        if (password1.length < 8) {
            password1Error = "Password must be at least 8 characters";
            valid = false;
        } else if (!(/[a-zA-Z]+/.test(password1) && /[0-9]+/.test(password1) && /[!@#$%^&*]/.test(password1))) {
            password1Error = "Letters, numbers, and special characters required";
            valid = false;
        }

        if (password1 !== password2) {
            password2Error = "Passwords do not match";
            valid = false;
        }

        if (!terms) {
            termsError = "You must accept the terms and conditions";
            valid = false;
        }

        setUsernameError(usernameError);
        setPassword1Error(password1Error);
        setPassword2Error(password2Error);
        setEmailError(emailError);
        setfirstNameError(firstNameError);
        setLastNameError(lastNameError);
        setTermsError(termsError);
        return valid;
    }

    function register() {
        if (validate()) {
            const body = JSON.stringify({
                email: email,
                username: username,
                first_name: firstName,
                last_name: lastName,
                password: password1,
                password2: password2
            });
            axios.post(BACKENDURL.concat("/accounts/signup/"), body, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                const body = JSON.stringify({
                    username: username,
                    password: password1
                });
                axios.post(BACKENDURL.concat("/accounts/login/"), body, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    setCookie('token', response.data["access"], { path: '/' });
                });
            }).catch(error => {
                setUsernameError("Username already taken");
            });
        }
    }
    return (
        <>
            <div id="regOverlay"></div>
            <div id="regPopup">
                <h2 class="col-blue">Sign-Up</h2>

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
                                required
                                onChange={(e) => setUsername(e.target.value)} />
                            <p class="errorLabel">{usernameError}</p>
                        </div>
                        <div class="col-blue">
                            <label class="form-label">Email address</label>
                            <input
                                type="text"
                                class="form-control"
                                id="email"
                                name="email"
                                required
                                onChange={(e) => setEmail(e.target.value)} />
                            <p class="errorLabel">{emailError}</p>
                        </div>
                        <div class="col-blue">
                            <label class="form-label">First Name</label>
                            <input
                                type="text"
                                class="form-control"
                                name="first-name"
                                required
                                onChange={(e) => setFirstName(e.target.value)} />
                            <p class="errorLabel">{firstNameError}</p>
                        </div>
                        <div class="col-blue">
                            <label class="form-label">Last Name</label>
                            <input
                                type="text"
                                class="form-control"
                                name="last-name"
                                required
                                onChange={(e) => setLastName(e.target.value)} />
                            <p class="errorLabel">{lastNameError}</p>
                        </div>
                        <div class="col-blue">
                            <label class="form-label">Password</label>
                            <input
                                type="password"
                                class="form-control"
                                name="password1"
                                required
                                onChange={(e) => setPassword1(e.target.value)} />
                            <p class="errorLabel">{password1Error}</p>
                        </div>
                        <div class="col-blue">
                            <label class="form-label">Repeat Password</label>
                            <input
                                type="password"
                                class="form-control"
                                name="password2"
                                required
                                onChange={(e) => setPassword2(e.target.value)} />
                            <p class="errorLabel">{password2Error}</p>
                        </div>
                        <div class="form-check col-blue">
                            <input
                                type="checkbox"
                                class="form-check-input"
                                id="terms"
                                name="terms"
                                required
                                onChange={(e) => setTerms(e.target.value)} />
                            <label class="form-check-label" for="terms">Accept Terms and Conditions</label>
                            <p class="errorLabel">{termsError}</p>
                        </div>
                    </form>
                    <button type="submit" class="sub" onClick={register}>Sign Up</button>
                </div>
            </div>
        </>
    );
}

export default RegisterPopup;