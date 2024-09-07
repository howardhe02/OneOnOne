import React, { useState, useEffect, useCallback } from 'react';
import { useCookies } from 'react-cookie';
import ContactItem from './ContactItem';
import ContactItemAdd from './ContactItemAdd';
import "../static/style.css";
import "../static/contacts.css";
import axios from 'axios';

function ContactsPopup( {closePopup, BACKENDURL} ) {  
    const [cookie, ] = useCookies(['token']);
    const [showAdd, setShowAdd] = useState(false);
    const [contacts, setContacts] = useState([]);

    function toggleAdd() {
      if (showAdd) {
        setShowAdd(false);
      } else {
        setShowAdd(true);
      }
    }

    // wrap render contacts in useCallback hook to avoid dependency warning
    // need to do this since it's reused in other components
    const renderContacts = useCallback(() => {
      axios.get(BACKENDURL+"/schedules/contacts/", 
      {
          headers: {
              'Authorization': 'Bearer '+cookie.token,
              'Content-Type': 'application/json'
          }
      })
      .then(response => {
          setContacts(response.data);
      })
      .catch(error => {
          if(error.response.status===401){
            window.location.href = '/';
          }
      });
    }, [BACKENDURL, cookie])

    useEffect(()=>{ // run on page load
      renderContacts();
    }, [renderContacts])

    return (
    <>
    <div id="overlay"></div>
    <div id="contacts-popup">
      <div className="popupcontent">
        <div className="row">
          <div className="col">
            <h4 className="col-blue">Contacts</h4>
          </div>
          <div className="col">
            <div
              className="btn-toolbar"
              role="toolbar"
              aria-label="Contacts Toolbar">
              <div
                className="btn-group me-2"
                role="group"
                id="toolbar-edit-contacts"
                aria-label="Contacts Toolbar Group 1">
                <button className="btn btn-primary" onClick={toggleAdd}>+</button>
              </div>
              <div
                className="btn-group"
                role="group"
                aria-label="Contacts Toolbar Group 2">
                <button className="btn button" onClick={closePopup}>x</button>
              </div>
            </div>
          </div>
        </div>
        <br />
        { showAdd ? <ContactItemAdd BACKENDURL={BACKENDURL} toggleView={toggleAdd} renderContacts={renderContacts}/> : null }
        {
            contacts.map((contact) => (
                <ContactItem key={contact.email} contact={contact} renderContacts={renderContacts} BACKENDURL={BACKENDURL} />
            ))
        }
      </div>
    </div>
    </>
    )
}

export default ContactsPopup;