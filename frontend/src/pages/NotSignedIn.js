import '../static/NotSignedIn.css';
import LoginPopup from '../components/LoginPopup';
import RegisterPopup from '../components/RegisterPopup';
import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie'
import { Navigate } from "react-router-dom";
import axios from 'axios';

function NotSignedIn({ BACKENDURL }) {
    const [redirect, setRedirect] = useState(false);
    const [cookies,] = useCookies();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [Blur, setBlur] = useState("")

    function openLoginPopup() {
        setIsLoginOpen(true);
        setBlur(" blur");
    }

    function closeLoginPopup() {
        setIsLoginOpen(false);
        setBlur("");
    }

    function openRegisterPopup() {
        setIsRegisterOpen(true);
        setBlur(" blur");
    }

    function closeRegisterPopup() {
        setIsRegisterOpen(false);
        setBlur("");
    }
    useEffect(() => {
        function checkLoginStatus() {
            if (cookies.token) {
                axios.post(BACKENDURL.concat("/accounts/checktoken/"), {}, {
                    headers: {
                        'Authorization': 'Bearer ' + cookies.token
                    }
                }).then(response => {
                    setRedirect(true);
                }).catch(error => {
                    return;
                });
            }
        }
        checkLoginStatus();
    }, [cookies.token, BACKENDURL]);

    return (
        <>
            {redirect && <Navigate to="/dashboard" />}
            <div class={"container-fluid".concat(Blur)}>
                <div class="row align-items-center full">
                    <div
                        class="col-md-8 col-sm-12 med-full line align-items-center c-text c-item"
                        id="welcome">
                        <div>
                            <h1>Welcome to 1-on-1</h1>
                            <br />
                            <p>Your one stop online meeting scheduling system.</p>
                            <p>Get started now by signing up!</p>
                        </div>
                    </div>
                    <div
                        class="col-md-4 col-sm-12 med-full align-items-center c-text c-item"
                        id="login">
                        <div>
                            <button class={"log".concat(Blur)} onClick={openLoginPopup} >Login</button>
                            <br />
                            <button class={"reg".concat(Blur)} onClick={openRegisterPopup}>Sign up</button>
                        </div>
                    </div>
                </div>
            </div>

            {isLoginOpen && <LoginPopup closePopup={closeLoginPopup} BACKENDURL={BACKENDURL} />}
            {isRegisterOpen && <RegisterPopup closePopup={closeRegisterPopup} BACKENDURL={BACKENDURL} />}
        </>
    );
}

export default NotSignedIn;