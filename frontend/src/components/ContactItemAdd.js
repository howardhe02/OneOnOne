import { useState } from 'react';
import { useCookies } from 'react-cookie';
import axios from 'axios';


function ContactItemAdd ( {toggleView, renderContacts, BACKENDURL} ) {
    const [cookie, ] = useCookies(['token']);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [formError, setFormError] = useState('');

    function validate() {
        let valid = true;
        setFirstNameError("");
        setLastNameError("");
        setEmailError("");
        setFormError("");

        if (!firstName) {
            setFirstNameError("First name is required.");
            valid = false;
        }
        if (!lastName) {
            setLastNameError("Last name is required.");
            valid = false;
        }
        if (!email) {
            setEmailError("Email is required.");
            valid = false;
        }
        return valid
    };

    function addContact(event) {
        event.preventDefault(); // prevents page refresh
        if ( validate()) {
            axios.post(BACKENDURL+"/schedules/contacts/", 
            {
                first_Name: firstName,
                last_Name: lastName,
                email: email
            },
            {
                headers: {
                    'Authorization': 'Bearer '+cookie.token,
                    'Content-Type': 'application/json',
                }
            })
            .then(response => {
                toggleView();
                renderContacts();
            })
            .catch(error => {
                if(error.response.status===400) {
                    setFormError(error.response.data['email']);
                }
                if(error.response.status===401){
                    window.location.href = '/';
                }
            });
        }
    }

    return (
        <div>
            <form className="col-blue">
            <label className="form-label">Name</label>
            <div className="row">
                <div className="col">
                <div className="mb-3">
                    <input
                    type="text"
                    className="form-control"
                    id="input-contact-fname"
                    placeholder="First Name..."
                    aria-label="First name" 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required />
                </div>
                </div>
                <div className="col">
                <div className="mb-3">
                    <input
                    type="text"
                    className="form-control"
                    id="input-contact-lname"
                    placeholder="Last Name..."
                    aria-label="Last name" 
                    onChange={(e) => setLastName(e.target.value)} 
                    required />
                </div>
                </div>
            <span className="error-label">{firstNameError}</span>
            <span className="error-label">{lastNameError}</span>
            </div>
            <div className="mb-3">
                <label htmlFor="input-contact-email" className="form-label">
                    Email Address
                </label>
                <input
                type="email"
                className="form-control"
                id="input-contact-email"
                placeholder="Email..." 
                onChange={(e) => setEmail(e.target.value)}
                required />
            </div>
            <p className="error-label">{emailError}</p>
            <p className="error-label">{formError}</p>
            <button type="submit" className="button" onClick={addContact}>Add Contact</button>
            </form>
            <br />
        </div>
    )
}

export default ContactItemAdd;