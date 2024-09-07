import { useState } from 'react';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import ContactItemUpdate from './ContactItemUpdate';

function ContactItem( {contact, renderContacts, BACKENDURL} ) {
    const [cookie, ] = useCookies(['token']);
    const [showUpdate, setShowUpdate] = useState(false);

    function toggleUpdate() {
      if (showUpdate) {
        setShowUpdate(false);
      } else {
        setShowUpdate(true);
      }
    }

    function deleteContact() {
        axios.delete(BACKENDURL+"/schedules/contacts/", 
            {
                headers: {
                    'Authorization': 'Bearer '+cookie.token,
                    'Content-Type': 'application/json',
                },
                data: {
                  contact_id: contact.id
                }
            })
            .then(response => {
                renderContacts();
            })
            .catch(error => {
                if(error.response.status===401){
                  window.location.href = '/';
                }
            });
    }

    return (
        <div className="row justify-content-center contact-item">
          <div className="col-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/af/Default_avatar_profile.jpg"
              alt="Avatar Profile"
              className="rounded mx-auto d-block contact-avatar" />
          </div>
          <div className="col-7">
            <span className="contact-info">
              <p className="contact-name">{contact.first_Name} {contact.last_Name}</p>
              <p className="contact-email">{contact.email}</p>
            </span>
          </div>
          <div className="col-2">
            <div
                className="btn-group me-2"
                role="group"
                id="toolbar-edit-contacts"
                aria-label="Contacts Toolbar Group 1">
                <button type="button" className="btn btn-primary btn-sm" onClick={toggleUpdate}>/</button>
                <button type="button" className="btn btn-dark btn-sm" onClick={deleteContact}>x</button>
              </div>
          </div>
            { showUpdate ? <ContactItemUpdate contact={contact} BACKENDURL={BACKENDURL} toggleView={toggleUpdate} renderContacts={renderContacts} /> : null }
        </div>
    )
}

export default ContactItem;