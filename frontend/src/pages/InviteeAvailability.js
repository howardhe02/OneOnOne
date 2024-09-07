import Calendar from "../components/Calendar";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import {useParams} from 'react-router-dom';

function InviteeAvailability({BACKENDURL}) {
    // load meeting information
    const {calendarID, token} = useParams();
    const [meetingName, setMeetingName] = useState("");
    const [deadline, setDeadline] = useState("");
    const [description, setDescription] = useState("");
    const [inviter, setInviter] = useState("");
    const [invitee, setInvitee] = useState("");
    const url = BACKENDURL+"/schedules/calendars/"+calendarID+"/respond/"+token+"/";

    useEffect(()=>{
        const get_meetingData = async () => {
            axios.get(url, 
            {
              headers: {
                  'Content-Type': 'application/json'
              }
            })
            .then(response=> {
                const meeting = response.data;
                console.log(meeting);
                const invitee_list = meeting['invitee_id'];
                setMeetingName(meeting['name']);
                setInvitee(invitee_list['first_Name']+ " " + invitee_list["last_Name"]);
                setDeadline(meeting["deadline"]);
                setInviter(meeting["owner"].first_name + " " + meeting["owner"].last_name);
                setDescription(meeting["description"]);
            })
            .catch(error => {
                console.log(error.reponse.data);
                if(error.response.status===401){
                  window.location.href = '/';
                }
            });
        };

        get_meetingData();
    },[url]);

    // intitialise data for POST request
    const [allAvailSlots, setAllAvailSlots] = useState([]);
    const [formData, setFormData] = useState({
        "availability": [],
    });
    
    function formatSlotDate(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${year}/${month}/${day}`;
    }

    function convertAvailableSlots(slots) {
        return (
            slots.map(slot => ({
                start_time: `${formatSlotDate(slot.date)} ${slot.start_time}`,
                end_time: `${formatSlotDate(slot.date)} ${slot.end_time}`,
                preference_level: slot.preference_level
            }))
        )
    }

    const handleSubmit = async () => {
        console.log(allAvailSlots);
        
        axios.post(url, {
            "availability": convertAvailableSlots(allAvailSlots),
        }, 
        {
            headers: {
                "Content-Type": "application/json",
            }
        })
        .then(response => {
            console.log(response);
            document.getElementById("response_msg").innerText = "Thank you for submitting your availability.";
        })
        .catch(error => {
            console.log(error);
            if(error.response.status===401){
                window.location.href = '/';
              }
        });
        
        
    }

    const formatDate = (deadline)=>{
        const dateObj = new Date(deadline);

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    };

    return (
        <div id="page-body">
        <h2 className="col-blue"> <span className="contact-name">{inviter}</span> 
            is inviting you (<span className="contact-name">{invitee}</span>) to a meeting: 
        </h2>
        <div className="popupcontent">
        <p className="meeting-name">
            <span className="col-blue">Meeting name: </span>
            <span>{meetingName}</span>
        </p>
        <p className="description">
            <span className="col-blue">Description: </span>
            <span>{description}</span>
        </p>
        <p>
            <span className="col-blue">Deadline: </span>
            <span>{formatDate(deadline)}</span>
        </p>
            <p className="italics">Please fill in your availability below: </p>
            <Calendar 
                month={new Date().getMonth()+1} 
                year={new Date().getFullYear()}
                allAvailSlots={allAvailSlots}
                setAllAvailSlots={setAllAvailSlots}/>
        </div>
        <div id="response_msg"></div>
        <div className="submit-button-div">
                <button className="btn submit-button" onClick={handleSubmit}>Confirm</button>
            </div>
        </div>
    );
}

export default InviteeAvailability;