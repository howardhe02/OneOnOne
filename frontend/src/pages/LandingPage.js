import '../static/DashBoard.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { Navigate } from 'react-router-dom';
import NewMeeting from '../components/NewMeeting';
import Calendar from '../components/Calendar';
import ContactsPopup from '../components/ContactsPopup';
import CalendarFinalizePopup from '../components/CalendarFinalizePopup';
import CalendarDetailsPopup from '../components/CalendarDetailsPopup';
import CalendarCustomizePopup from '../components/CalendarCustomizePopup';

function LandingPage({ BACKENDURL }) {
    const [cookies, removeCookie] = useCookies(['token']);
    const [redirect, setRedirect] = useState(false);
    const [unfinalizedMeetings, setUnfinalizedMeetings] = useState([]);
    const [finalizedMeetings, setFinalizedMeetings] = useState([]);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [Blur, setBlur] = useState("")

    const [showContacts, setShowContacts] = useState(false);
    const [showCalendarFinalize, setShowCalendarFinalize] = useState(false);
    const [showCalendarDetails, setShowCalendarDetails] = useState(false);
    const [showCalendarCustomize, setShowCalendarCustomize] = useState(false);
    const [activeCalendar, setActiveCalendar] = useState('');
    
    function showContactsPopup(show) {
        setShowContacts(show);
    }

    function showCalendarFinalizePopup(show) {
        setShowCalendarFinalize(show);
    }

    function showCalendarCustomizePopup(show) {
      setShowCalendarCustomize(show);
    }

    function showCalendarDetailsPopup(show, calendar_id) {
        setActiveCalendar(calendar_id);
        setShowCalendarDetails(show);
    }

    function openNewMeeting() {
      setIsLoginOpen(true);
      setBlur(" blur");
    }

    function closeNewMeeting() {
      setIsLoginOpen(false);
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
                    axios.get(BACKENDURL.concat("/schedules/home/"), {
                        headers: {
                            'Authorization': 'Bearer ' + cookies.token
                        }
                    }).then(response => {
                        setUnfinalizedMeetings(response.data["unfinalized_meetings"]);
                        setFinalizedMeetings(response.data["finalized_meetings"]);

                    }).catch(error => {
                        console.log(error);
                    });
                }).catch(error => {
                    setRedirect(true);
                });
            }
        }
        checkLoginStatus();
    }, [cookies.token, BACKENDURL]);

    const formatDeadline = (deadline) => {
        return new Date(deadline).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    function handleLogout() {
      removeCookie('token');
  }

    return (
        <>
        {redirect && <Navigate to="/" />}
          <div className={"navbar".concat(Blur)}>
            <a className="current" href="/">
              <div className="container">
                <img alt="logo" src={ require('./images/logo.png') } />
              </div>
            </a>
            <div className="btns">
              {/* <a className=""> */}
                {/* <button className={"nav-btn".concat(Blur)}>Contacts</button> */}
              {/* </a> */}
              <button className={"nav-btn".concat(Blur)} onClick={openNewMeeting} >New Meeting</button>
              <button className={"nav-btn".concat(Blur)} onClick={() => showContactsPopup(true)}>Contacts</button>
                <button className={"nav-btn".concat(Blur)} onClick={handleLogout}>Log out</button>
            </div>
          </div>
           


          <div className={"container-fluid".concat(Blur)}>
            <div className="row align-items-center">
              <div className="col-md-4 col-sm-12 c-text">
                <div className="row">
                  <div style={{marginBottom: '20px', marginTop: '10px'}}>
                      <button className={"reg".concat(Blur)} onClick={openNewMeeting} >New Meeting</button>
                  </div>
                  <div className="col-sm">
                    <h4>Finalized Meetings</h4>
                      {finalizedMeetings.map(meeting => (
                    <div key={meeting.id} className={"meeting-display-finalized".concat(Blur)} onClick={() => showCalendarDetailsPopup(true, meeting.id)}>
                        <span class="meeting-display-title"> {meeting.name} </span>
                        <span class="meeting-display-date"> {formatDeadline(meeting.deadline)} </span>
                        <span class="meeting-display-description">{meeting.description}</span>
                    </div>
                ))}
                  </div>
                  <div className="col-sm">
                    <h4>Unfinalized Meetings</h4>
                      {unfinalizedMeetings.map(meeting => (
                    <div key={meeting.id} className={"meeting-display-finalized".concat(Blur)} onClick={() => showCalendarDetailsPopup(true, meeting.id)}>
                        <span class="meeting-display-title"> {meeting.name} </span>
                        <span class="meeting-display-date"> {formatDeadline(meeting.deadline)} </span>
                        <span class="meeting-display-description">{meeting.description}</span>
                    </div>
                ))}
                  </div>
                </div>
              </div>
              <div className="col-md-8 col-sm-12 align-items-center" id="login">
              <br/>
              <Calendar month={
                  new Date().getMonth()+1} 
                  year={new Date().getFullYear()} 
                  allAvailSlots={[]} 
                  setAllAvailSlots={[]}/>
              </div>
            </div>
          </div>
          {/* Pop-ups */}
          {isLoginOpen && <NewMeeting closePopup={closeNewMeeting} BACKENDURL={BACKENDURL} />}
          {showContacts ? <ContactsPopup closePopup={() => showContactsPopup(false)} BACKENDURL={BACKENDURL} /> : null}
          {showCalendarDetails ? <CalendarDetailsPopup calendar_id={activeCalendar} closePopup={() => showCalendarDetailsPopup(false)} toggleFinalize={() => showCalendarFinalizePopup(true)} BACKENDURL={BACKENDURL} /> : null}
          {showCalendarFinalize ? <CalendarFinalizePopup calendar_id={activeCalendar} closePopup={() => showCalendarFinalizePopup(false)} toggleCustomize={() => showCalendarCustomizePopup(true)} BACKENDURL={BACKENDURL} /> : null}
          {showCalendarCustomize ? <CalendarCustomizePopup calendar_id={activeCalendar} closePopup={() => showCalendarCustomizePopup(false)} BACKENDURL={BACKENDURL} displayInvitees={"True"}/> : null}
        </>
      );
    
}

    
  
  export default LandingPage;

// import { useState } from 'react';
// import ContactsPopup from '../components/ContactsPopup';
// import CalendarFinalizePopup from '../components/CalendarFinalizePopup';
// import CalendarDetailsPopup from '../components/CalendarDetailsPopup';
