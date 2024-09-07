import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import "../static/style.css";
import "../static/meeting-calendar.css";
import axios from 'axios';
import CalendarMeetings from './CalendarMeetings';


function CalendarFinalizePopup({ calendar_id, closePopup, toggleCustomize, BACKENDURL }) {
    const [cookie,] = useCookies(['token']);
    const [display, setDisplay] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    // const [deadline, setDeadline] = useState('');
    const [invitees, setInvitees] = useState([]);
    const [allSchedules, setAllSchedules] = useState([]);
    const [displayID, setDisplayID] = useState(null);
    const [displaySchedule, setDisplaySchedule] = useState([]);
    // const [suggested, setSuggested] = useState([]);
    // const [inviteeAvail, setInviteeAvail] = useState([]);
    useEffect(() => { // run on page load
        async function renderFinalize() {
            await axios.get(BACKENDURL + "/schedules/calendars/" + calendar_id + "/confirm/",
                {
                    headers: {
                        'Authorization': 'Bearer ' + cookie.token,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    setName(response.data.name);
                    setDescription(response.data.description);
                    // setDeadline(response.data.deadline);
                    setInvitees(response.data.invitees);
                    if (response.data.suggested_schedules.length === 0) {
                        setDisplay(false);
                    }
                    else {
                        setAllSchedules(response.data.suggested_schedules);
                        setDisplayID(0);
                        setDisplaySchedule(response.data.suggested_schedules[0]);
                    }
                    //setInviteeAvail(response.data.invitee_availability);
                })
                .catch(error => {
                    if (error.response.status === 401) {
                        window.location.href = '/';
                    }
                });
        }
        renderFinalize();
    }, [calendar_id, BACKENDURL, cookie])

    const handleScheduleChange = (event) => {
        var button1 = document.getElementById("schedule-1");
        var button2 = document.getElementById("schedule-2");
        if (displayID !== event.target.value) {
            button1.classList.toggle("active");
            button2.classList.toggle("active");
        }
        setDisplayID(event.target.value);
        setDisplaySchedule([]);
        setDisplaySchedule(allSchedules[event.target.value]);
    };

    function changeDateTimeFormat(datetime) {
        const date = datetime.slice(0, 10);
        const time = datetime.slice(11, 19);
        var [YYYY, MM, DD] = date.split("-");
        return YYYY + "/" + MM + "/" + DD + " " + time
    }

    function remove_name(displaySchedule) {
        const newSchedule = displaySchedule.map(meeting => (
            {
                "contact_id": meeting.id,
                "start_time": changeDateTimeFormat(meeting.start_time),
                "end_time": changeDateTimeFormat(meeting.end_time),
            }
        ));
        return newSchedule;
    }

    const handleFinalizeMeeting = () => {
        document.getElementById("finalize_msg").innerText = "";
        if (displaySchedule.length === 0) {
            return null;
        }
        const formData = {
            "finalized_schedule": remove_name(displaySchedule),
        };
        async function finalize() {
            const url = BACKENDURL + "/schedules/calendars/" + calendar_id + "/confirm/"
            await axios.post(url, formData,
                {
                    headers: {
                        'Authorization': 'Bearer ' + cookie.token,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    document.getElementById("finalize_msg").innerText = "Calendar has been finalized.";
                })
                .catch(error => {
                    console.log(error.response.data);
                    if (error.response.status === 401) {
                        window.location.href = '/';
                    }
                });
        }
        finalize();
    }

    function configButtons() {
        return (
            <>
                {/* <button className="option-btn" onClick = {handleChangeAvailability}>Change Availability</button> */}
                <button className="option-btn" onClick={() => toggleCustomize()}>Customize</button>
            </>
        )
    }

    if (calendar_id) {
        return (
            <>
                <div id="cal-popup" style={{ height: 100 + '%' }}>
                    <button className="close-btn" onClick={closePopup}>x</button>
                    <h2 className="col-blue meeting-name">{name}</h2>
                    <div className="finalized-details">
                        <div id="details-col">
                            <p><span className="col-blue">Notes: </span><span>{description}</span></p>
                            <p className="col-blue subheader">Invited:</p>
                            <ul>
                                {
                                    invitees.map((invitee) => (
                                        <li key={invitee.id}>{invitee.first_name} {invitee.last_name}</li>
                                    ))
                                }
                            </ul>
                            {display && <p className="col-blue subheader">Suggested Schedules:</p>}
                            {!display && <p className="col-blue subheader">No Suggested Schedules Availables</p>}
                            <div>
                                {display && <button id="schedule-1" className="option-btn active" value={0}
                                    onClick={handleScheduleChange}>Schedule 1</button>}
                                {display && <button id="schedule-2" className="option-btn" value={1}
                                    onClick={handleScheduleChange}>Schedule 2</button>}
                                {/* <button className="option-btn">Customized</button> */}
                                {configButtons()}
                            </div>
                            <div><br /><br /></div>
                            {display && <div>
                                <p className="col-blue subheader">Finalize Meeting:</p>
                                <button className="option-btn" onClick={handleFinalizeMeeting}>Finalize Meeting</button>
                                <span style={{ fontSize: "small", fontStyle: "italic" }} id="finalize_msg"></span>
                            </div>}
                        </div>
                        <div id="calendar-col">
                            {display && <CalendarMeetings
                                month={new Date().getMonth() + 1}
                                year={new Date().getFullYear()}
                                allMeetings={displaySchedule} />}
                        </div>
                    </div>
                </div >
            </>

        )
    }
}

export default CalendarFinalizePopup;