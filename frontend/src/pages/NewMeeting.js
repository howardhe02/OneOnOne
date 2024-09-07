import React, { useState, useEffect } from "react";
import Calendar from "../components/Calendar";
import "../static/NewMeeting.css";
import { useCookies } from 'react-cookie';
import axios from 'axios';

const NewMeeting = ({BACKENDURL}) => {
    const [cookie, ] = useCookies(['token']);
    const [contacts, setContacts] = useState([]);
    //get the contacts
    
    useEffect(()=>{
        const get_contacts = async (setContacts) => {
            axios.get(BACKENDURL+"/schedules/contacts/", 
            {
              headers: {
                  'Authorization': 'Bearer '+ cookie.token,
                  'Content-Type': 'application/json'
              }
            })
            .then(response=> {
                setContacts(response.data);
            })
            .catch(error => {
                if(error.response.status===401){
                  window.location.href = '/';
                }
            });
        };

        get_contacts(setContacts);
    },[BACKENDURL, cookie]);

    //initialize the slots and form for submitting the request
    const [allAvailSlots, setAllAvailSlots] = useState([]);
    const [formData, setFormData] = useState({
        "name": "",
        "description": "",
        "deadline": "",
        "invitees": [],
        "available_slots": allAvailSlots,
    });
    
    //what to do when something gets added or removed
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({
          ...formData,
          [name]: value,
        });
    };

    const handleInviteeChange = (event) => {
        const options = event.target.options;
        const selectedIds = [];

        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedIds.push(parseInt(options[i].value));
            }
        }
        setFormData({
            ...formData,
            invitees: selectedIds,
        });
    };

    //what to do when you press submit
    const handleSubmit = async (event)=> {
        document.getElementById("name_errmsg").innerText="";
        document.getElementById("description_errmsg").innerText="";
        document.getElementById("deadline_errmsg").innerText="";
        document.getElementById("invitees_errmsg").innerText="";
        document.getElementById("slots_errmsg").innerText="";

        event.preventDefault();
        formData.available_slots = allAvailSlots;

        if (formData.available_slots.length === 0){
            document.getElementById("slots_errmsg").innerText="Please fill in an available slot.";
        }

        //submit response using POST
        axios.post(BACKENDURL+"/schedules/calendars/create/", formData, 
        {
            headers: {
                'Authorization': 'Bearer '+ cookie['token'],
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
            const allErrors = error.response.data;
            if (allErrors.name){
                document.getElementById("name_errmsg").innerText = allErrors.name[0];
            }
            if (allErrors.description){
                document.getElementById("description_errmsg").innerText = allErrors.description[0];
            }
            if (allErrors.deadline){
                document.getElementById("deadline_errmsg").innerText = "Please enter a deadline.";
            }
            if (allErrors.invitees){
                document.getElementById("invitees_errmsg").innerText = allErrors.invitees[0];
            }
            if (allErrors.available_slots){
                document.getElementById("slots_errmsg").innerText = allErrors.available_slots[0];
            }
            console.log(error);
            
            //token expired
            if(error.response.status===401){
                window.location.href = '/';
            }
        });        
    }

    return (
        <div id="content">
        <div id="title"> 
        <h2 className="col-blue heading">New Meeting
        </h2></div>
        <div id="popup">
        <div id="form">
        <form>
            <div className="mb-3 col-blue">
                <label htmlFor="name" className="form-label">Meeting Name</label>
                <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    required
                    onChange={handleChange}/>
                <div id="name_errmsg" className="errmsg"></div>
            </div>
            <div className="mb-3 col-blue">
                <label htmlFor="deadline" className="form-label">Deadline</label>
                <input
                    type="datetime-local"
                    className="form-control"
                    id="date"
                    name="deadline"
                    required
                    onChange={handleChange}/>
                <div id="deadline_errmsg" className="errmsg"></div>
            </div>
            <div className="mb-3 col-blue">
                <label htmlFor="invitees" className="form-label">
                    Invite Contacts (Hold Ctrl (Windows) or Command (Mac) to select
                    multiple)</label>
                <select name="invitees" id="invitees" multiple onChange={handleInviteeChange}>
                    {contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>{contact.email}</option>
                    ))}
                </select>
                <div id="invitees_errmsg" className="errmsg"></div>
            </div>
            <div className="mb-3 col-blue">
                <label htmlFor="description" className="form-label">Notes</label>
                <input
                type="text"
                className="form-control"
                id="description"
                name="description"
                required
                onChange={handleChange}/>
                <div id="description_errmsg" className="errmsg"></div>
            </div>
            <button type="submit" className="sub" onClick={(event)=>{handleSubmit(event)}}>Create</button>
        </form>
        </div>
        <div id="calendar">
            <Calendar 
            month={new Date().getMonth()+1} 
            year={new Date().getFullYear()}
            allAvailSlots={allAvailSlots}
            setAllAvailSlots={setAllAvailSlots}/>
            <div id="slots_errmsg" className="errmsg"></div>
        </div>
    </div>
    </div>
    );

}
export default NewMeeting;