import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import Calendar from './Calendar';
import "../static/style.css";
import "../static/meeting-calendar.css";
import axios from 'axios';


function CalendarCustomized({ calendar_id, closePopup, BACKENDURL, displayInvitees }) {

    const [cookie,] = useCookies(['token']);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [, setPrevAvailSlots] = useState([]); //use this to keep track of the old slots
    const [updatedSlots, setUpdatedSlots] = useState([]); //use this to keep track of the new slots
    const [finalized, setFinalized] = useState('');
    const [inviteeAvails, setInviteeAvails] = useState([]);

    // const [ownerAvail, setOwnerAvail] = useState([]);
    const [finalizedSchedule,] = useState([]);

    useEffect(() => { // run on page load
        async function renderCalendar() {
            await axios.get(BACKENDURL + "/schedules/calendars/" + calendar_id + "/details/",
                {
                    headers: {
                        'Authorization': 'Bearer ' + cookie.token,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    console.log(response.data);
                    setName(response.data.Calendar.name);
                    setDescription(response.data.Calendar.description);
                    setDeadline(response.data.Calendar.deadline);
                    setFinalized(response.data.Calendar.finalized);
                    setInviteeAvails(response.data.Invitee_availability);
                    setPrevAvailSlots(response.data.Owner_availability.slots);
                    setUpdatedSlots(response.data.Owner_availability.slots);
                })
                .catch(error => {
                    if (error.response.status === 401) {
                        window.location.href = '/';
                    }
                });
        }
        renderCalendar();
    }, [calendar_id, BACKENDURL, cookie])

    function inviteeItem(invitee) {
        return <li key={invitee.contact.id}>{invitee.contact.first_Name} {invitee.contact.last_Name}</li>
    }


    const handleFinalizeMeeting = async () => {
        try {
            const response = await axios.post(`${BACKENDURL}/schedules/calendars/${calendar_id}/confirm/`, {
                finalized_schedule: finalizedSchedule,
            }, {
                headers: {
                    'Authorization': `Bearer ${cookie.token}`
                }
            });

            if (response.status === 200) {
                console.log('Meeting successfully finalized.');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error finalizing the meeting:', error);
        }
    };


    function configButtons() {
        if (finalized) {
            return ""
        } else {
            return (
                <>
                    {/* <button className="option-btn" onClick = {handleChangeAvailability}>Change Availability</button> */}
                    <button className="option-btn" onClick={() => handleFinalizeMeeting()}>Finalize</button>
                </>
            )
        }
    }

    function removeIDsUpdatedSlots(updatedSlots) {
        //removes the id field from the list updatedSlots
        const newSlots = updatedSlots.map(slot => ({
            "date": slot.date,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "preference_level": slot.preference_level,
        }));
        return newSlots;
    }
    useEffect(() => {
        setUpdatedSlots(removeIDsUpdatedSlots(updatedSlots));
    }, [updatedSlots]);

    const formatDeadline = (deadline) => {
        return new Date(deadline).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <>
            <div id="overlay"></div>
            <div id="cal-popup">
                <button className="close-btn" onClick={closePopup}>x</button>
                <div><h2 className="col-blue meeting-name">{name}<span id="update_msg"></span></h2></div>
                <div className="finalized-details">
                    <div id="details-col">
                        <p><span className="col-blue">Deadline: </span> {formatDeadline(deadline)}</p>
                        <p><span className="col-blue">Notes: </span>{description}</p>
                        <p className="col-blue subheader">Invited:</p>
                        <span>
                            {
                                inviteeAvails.map((invitee) => (
                                    inviteeItem(invitee)
                                ))
                            }
                        </span>
                        <div>
                            {configButtons()}
                        </div>
                    </div>
                    <div id="calendar-col">
                        <Calendar month={
                            new Date().getMonth() + 1}
                            year={new Date().getFullYear()}
                            allAvailSlots={updatedSlots}
                            setAllAvailSlots={setUpdatedSlots}
                            displayInviteesBool={displayInvitees}
                            inviteeAvails={inviteeAvails} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default CalendarCustomized;
