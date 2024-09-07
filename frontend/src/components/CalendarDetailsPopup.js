import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import Calendar from '../components/Calendar';
import "../static/style.css";
import "../static/meeting-calendar.css";
import axios from 'axios';
import CalendarMeetings from './CalendarMeetings';


function CalendarDetailsPopup({ calendar_id, closePopup, toggleFinalize, BACKENDURL }) {
    const [cookie,] = useCookies(['token']);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [prevAvailSlots, setPrevAvailSlots] = useState([]); //use this to keep track of the old slots
    const [updatedSlots, setUpdatedSlots] = useState([]); //use this to keep track of the new slots
    const [prevInvitees, setPrevInvitees] = useState([]); //use this to keep track of the old slots
    const [currInvitees, setCurrInvitees] = useState([]); //use this to keep track of the new slots
    const [finalized, setFinalized] = useState('');
    const [inviteeAvails, setInviteeAvails] = useState([]);
    // const [ownerAvail, setOwnerAvail] = useState([]);
    const [allContacts, setAllContacts] = useState([]);

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
                    setName(response.data.Calendar.name);
                    setDescription(response.data.Calendar.description);
                    setDeadline(response.data.Calendar.deadline);
                    setFinalized(response.data.Calendar.finalized);
                    setInviteeAvails(response.data.Invitee_availability);
                    setPrevAvailSlots(response.data.Owner_availability.slots);
                    setUpdatedSlots(response.data.Owner_availability.slots);
                    setPrevInvitees(response.data.Calendar.invitees);
                    setCurrInvitees(response.data.Calendar.invitees);
                })
                .catch(error => {
                    if (error.response.status === 401) {
                        window.location.href = '/';
                    }
                });
        }
        function getAllContacts() {
            axios.get(BACKENDURL + "/schedules/contacts/",
                {
                    headers: {
                        'Authorization': 'Bearer ' + cookie.token,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    console.log(response.data);
                    setAllContacts(response.data);
                })
                .catch(error => {
                    if (error.response.status === 401) {
                        window.location.href = '/';
                    }
                });
        }
        getAllContacts();
        renderCalendar();
    }, [calendar_id, BACKENDURL, cookie])

    function remindInvitee(calendar_id, contact_id) {
        const sendReminder = () => {
            const url = BACKENDURL + "/schedules/calendars/remind/" + calendar_id + "/" + contact_id + "/";
            axios.get(url,
                {
                    headers: {
                        'Authorization': 'Bearer ' + cookie['token'],
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    console.log(response.data.message);
                })
                .catch(error => {
                    console.log(error);
                    if (error.response.status === 401) {
                        window.location.href = '/';
                    }
                });
        };
        sendReminder();
    }

    function inviteeItem(invitee) {
        let done = "×";
        let remind = <button className="remind-btn" onClick={() => { remindInvitee(calendar_id, invitee.contact.id) }}>Remind</button>;
        if (invitee.status) {
            done = "✓";
            remind = "";
        }
        if (!finalized) {
            return <p key={invitee.contact.id}>{done} {invitee.contact.first_Name} {invitee.contact.last_Name} {remind}</p>
        } else {
            return <p key={invitee.contact.id}>{invitee.contact.first_Name} {invitee.contact.last_Name}</p>
        }
    }

    function configButtons() {
        if (finalized) {
            return ""
        } else {
            return (
                <>
                    <button className="option-btn" onClick={handleChangeAvailability}>Change Availability</button>
                    <button className="option-btn" onClick={handleChangeInvitees}>Change Invitees</button>
                    <button className="option-btn" onClick={() => toggleFinalize()}>Finalize</button>
                </>
            )
        }
    }

    function configInviteeSelect() {
        if (finalized) {
            return ""
        } else {
            return (
                <>
                    <label htmlFor="invitees" className="form-label">Update Invitees</label>
                    <select name="invitees" id="invitees" multiple onChange={onChangeInvitees} value={currInvitees}>
                        {
                            allContacts.map(contact => (
                                <option key={contact.id} value={contact.id}>{contact.email}</option>
                            ))
                        }
                    </select>
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
    }, [setUpdatedSlots, updatedSlots]);

    function findSlotChange(prevAvailSlots, updatedSlots) {
        const prevAvailSlotWithoutID = removeIDsUpdatedSlots(prevAvailSlots);
        const updAvailSlotWithoutID = removeIDsUpdatedSlots(updatedSlots);

        const removedSlots = prevAvailSlotWithoutID.filter(slot =>
            !updAvailSlotWithoutID.some(updatedSlot =>
                slot.date === updatedSlot.date &&
                slot.start_time === updatedSlot.start_time &&
                slot.end_time === updatedSlot.end_time &&
                slot.preference_level === updatedSlot.preference_level
            )
        );
        const addedSlots = updAvailSlotWithoutID.filter(updatedSlot =>
            !prevAvailSlotWithoutID.some(slot =>
                updatedSlot.date === slot.date &&
                updatedSlot.start_time === slot.start_time &&
                updatedSlot.end_time === slot.end_time &&
                updatedSlot.preference_level === slot.preference_level
            )
        );

        const removedSlotIDs = [];
        removedSlots.forEach(removedSlot => {
            const matchingSlot = prevAvailSlots.find(slot =>
                slot.date === removedSlot.date &&
                slot.start_time === removedSlot.start_time &&
                slot.end_time === removedSlot.end_time &&
                slot.preference_level === removedSlot.preference_level
            );
            if (matchingSlot) {
                removedSlotIDs.push(matchingSlot.id);
            }
        })
        return { removedSlotIDs, addedSlots };
    }

    const [updateAvailBody,] = useState({
        "add_availabilities": [],
        "remove_availbilities": [],
    });
    const handleChangeAvailability = ((event) => {
        document.getElementById("update_msg").innerText = "";
        const { removedSlotIDs, addedSlots } = findSlotChange(prevAvailSlots, updatedSlots);
        updateAvailBody.add_availabilities = addedSlots;
        updateAvailBody.remove_availabilities = removedSlotIDs;
        event.preventDefault();

        console.log(updateAvailBody);
        const url = BACKENDURL + "/schedules/calendars/" + calendar_id + "/details/"
        axios.put(url, updateAvailBody,
            {
                headers: {
                    'Authorization': 'Bearer ' + cookie['token'],
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                console.log(response.data);
                document.getElementById("update_msg").innerText = "       Availability updated.";
            })
            .catch(error => {
                console.log(error);
            })

    });

    const onChangeInvitees = ((event) => {
        document.getElementById("update_msg").innerText = "";
        const options = event.target.options;
        const selectedIds = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedIds.push(parseInt(options[i].value));
            }
        }
        setCurrInvitees(selectedIds);
        event.preventDefault();
    });

    function handleChangeInvitees() {
        let added = currInvitees.filter(x => !prevInvitees.includes(x));
        let removed = prevInvitees.filter(x => !currInvitees.includes(x));
        axios.put(BACKENDURL + "/schedules/calendars/" + calendar_id + "/details/",
            {
                add_invitees: added,
                remove_invitees: removed
            },
            {
                headers: {
                    'Authorization': 'Bearer ' + cookie['token'],
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                console.log(response.data);
                document.getElementById("update_msg").innerText = "       Invitee updated.";
            })
            .catch(error => {
                console.log(error);
            })
    }

    const formatDeadline = (deadline) => {
        return new Date(deadline).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    const [allMeetings, setAllMeetings] = useState([]);
    const [finalizedRendered, setFinalizedRendered] = useState(false);

    function renderFinalizedCalendar() {
        axios.get(BACKENDURL + "/schedules/calendars/" + calendar_id + "/meetings/",
            {
                headers: {
                    'Authorization': 'Bearer ' + cookie.token,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                setAllMeetings(response.data);
            })
            .catch(error => {
                if (error.response.status === 401) {
                    window.location.href = '/';
                }
            });
    }

    function show_calendar() {
        if (!finalized) {
            return (
                <Calendar month={
                    new Date().getMonth() + 1}
                    year={new Date().getFullYear()}
                    allAvailSlots={updatedSlots}
                    setAllAvailSlots={setUpdatedSlots} />
            );
        }
        else {
            if (!finalizedRendered) {
                renderFinalizedCalendar();
                setFinalizedRendered(true);
            }
            return (
                <CalendarMeetings
                    month={new Date().getMonth() + 1}
                    year={new Date().getFullYear()}
                    allMeetings={allMeetings} />
            );
        }
    }


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
                        <div className="mb-3 col-blue">
                            {configInviteeSelect()}
                        </div>
                        <div>
                            {configButtons()}
                        </div>
                    </div>
                    <div id="calendar-col">
                        {show_calendar()}
                    </div>
                </div>
            </div>
        </>
    )
}

export default CalendarDetailsPopup;
