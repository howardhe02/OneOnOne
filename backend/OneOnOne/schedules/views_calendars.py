from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Calendar
from .serializers import *
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from datetime import *
from django.core.mail import send_mail, EmailMessage
from django.utils import timezone
from django.utils.html import strip_tags
import icalendar
import os
import pytz

from django.conf import settings
import jwt
from urllib.parse import unquote


class CalendarDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, calendar_id):
        user = request.user
        calendar = get_object_or_404(Calendar, owner=user, pk=calendar_id)
        calendar_serializer = ViewCalendarSerializer(calendar)

        owner_availability = get_object_or_404(
            Owner_Availability, calendar=calendar_id)
        owner_availability_serializer = Owner_AvailabilitySerializer(
            owner_availability)

        invitee_availabilities = Invitee_Availability.objects.filter(
            calendar=calendar_id)
        invitee_availabilities_serializer = Invitee_AvailabilitySerializer(
            invitee_availabilities, many=True)
        response_data = {"Calendar": calendar_serializer.data,
                         "Owner_availability": owner_availability_serializer.data,
                         "Invitee_availability": invitee_availabilities_serializer.data}
        return Response(response_data)

    def put(self, request, calendar_id):
        user = request.user
        calendar = get_object_or_404(Calendar, owner=user, pk=calendar_id)
        serializer = UpdateCalendarSerializer(
            calendar, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()

            calendar = get_object_or_404(Calendar, owner=user, pk=calendar_id)
            calendar_serializer = ViewCalendarSerializer(calendar)

            owner_availability = get_object_or_404(
                Owner_Availability, calendar=calendar_id)
            owner_availability_serializer = Owner_AvailabilitySerializer(
                owner_availability)

            invitee_availabilities = Invitee_Availability.objects.filter(
                calendar=calendar_id)
            invitee_availabilities_serializer = Invitee_AvailabilitySerializer(
                invitee_availabilities, many=True)
            response_data = {"Calendar": calendar_serializer.data,
                             "Owner_availability": owner_availability_serializer.data,
                             "Invitee_avaibility": invitee_availabilities_serializer.data}
            return Response(response_data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateCalendarsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        data = request.data
        data["owner"] = user.id

        serializer = CreateCalendarSerializer(
            data=data, context={'request': request})
        if serializer.is_valid():
            invitees_data = serializer.validated_data.get('invitees', [])
            if not isinstance(invitees_data, list):
                invitees_data = [invitees_data]
            serializer.save(owner=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RespondToInviteView(APIView):

    def generate_response(self, calendar):
        result = {}
        result['calendar_id'] = calendar.id
        result['name'] = calendar.name
        result['description'] = calendar.description
        result['deadline'] = calendar.deadline
        result['owner'] = {
            'id': calendar.owner.id,
            'first_name': calendar.owner.first_name,
            'last_name': calendar.owner.last_name
        }
        result['invitees'] = []
        for invitee in calendar.invitees.all():
            invitee_data = {}
            invitee_data['id'] = invitee.id
            invitee_data['first_name'] = invitee.first_Name
            invitee_data['last_name'] = invitee.last_Name
            result['invitees'].append(invitee_data)
        result['owner_availability'] = []
        for slot in Owner_Availability.objects.get(user=calendar.owner, calendar=calendar).slots.all():
            slot_data = {}
            slot_data['date'] = slot.date
            slot_data['start_time'] = slot.start_time
            slot_data['end_time'] = slot.end_time
            result['owner_availability'].append(slot_data)

        return result

    def get(self, request, calendar_id, token):

        decoded_token = jwt.decode(
            unquote(token), settings.JWT_SECRET_KEY, algorithms=["HS256"], options={"verify_signature": False, "verify_exp": False})
        calendar = get_object_or_404(Calendar, id=calendar_id)
        data = self.generate_response(calendar)
        invitee_avail_obj = Invitee_Availability.objects.get(
            id=decoded_token['invitee_availability_id'])
        invitee_serializer = ContactSerializer(invitee_avail_obj.contact)
        invitee_serialized = invitee_serializer.data
        data['invitee_id'] = invitee_serialized
        return Response(data)

    def post(self, request, calendar_id, token):
        decoded_token = jwt.decode(
            unquote(token), settings.JWT_SECRET_KEY, algorithms=["HS256"], options={"verify_signature": False, "verify_exp": False})
        i_availbility = get_object_or_404(
            Invitee_Availability, id=decoded_token['invitee_availability_id'])
        calendar = get_object_or_404(Calendar, id=calendar_id)

        if timezone.now() > calendar.deadline:
            data = {'error': 'Deadline has passed'}
            return Response(data, status=status.HTTP_400_BAD_REQUEST)
        if i_availbility.status:
            data = {'error': 'Already responded'}
            return Response(data, status=status.HTTP_400_BAD_REQUEST)

        serializer = InviteeResponseSerializer(data=request.data)
        response = {}
        response['availability'] = []
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        for obj in request.data['availability']:
            serializer = AvailabilitySerializer(data=obj)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            slot = serializer.save()
            i_availbility.slots.add(slot)
            slot_data = {
                'date': slot.date,
                'start_time': slot.start_time,
                'end_time': slot.end_time,
                'preference_level': slot.preference_level
            }
            response['availability'].append(slot_data)
        i_availbility.status = True
        i_availbility.save()
        response['success_message'] = 'Availability submitted successfully'
        return Response(response, status=status.HTTP_200_OK)


class FinalizeCalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def suggest_schedule(self, calendar, user):
        result = []
        invitees = calendar.invitees.all()
        i_availability_3 = {}
        i_availability_2 = {}
        i_availability_1 = {}
        assigned = {}
        for invitee in invitees:
            temp = Invitee_Availability.objects.get(
                contact=invitee, calendar=calendar).slots.all()
            i_availability_3[invitee.id] = []
            i_availability_2[invitee.id] = []
            i_availability_1[invitee.id] = []
            assigned[invitee.id] = False
            for obj in temp:
                if obj.preference_level == 3:
                    i_availability_3[invitee.id].append(obj)
                elif obj.preference_level == 2:
                    i_availability_2[invitee.id].append(obj)
                elif obj.preference_level == 1:
                    i_availability_1[invitee.id].append(obj)

        def hourly_f_it(start, finish):
            while finish > start:
                yield start
                start = start + timedelta(hours=1)

        temp = []
        blocked = {}
        o_availability = Owner_Availability.objects.get(
            user=user, calendar=calendar).slots.all()
        for invitee in invitees:
            if not assigned[invitee.id]:
                for obj in o_availability:
                    if obj.start_time.minute == 0:
                        start = datetime.combine(obj.date, obj.start_time.replace(
                            second=0, microsecond=0, minute=0))
                    else:
                        start = datetime.combine(obj.date, obj.start_time.replace(
                            second=0, microsecond=0, minute=0, hour=obj.start_time.hour+1))

                    end = datetime.combine(obj.date, obj.end_time.replace(
                        second=0, microsecond=0, minute=0))

                    for hour in hourly_f_it(start, end):
                        if hour not in blocked:
                            for i_slot in i_availability_3[invitee.id]:
                                i_start = datetime.combine(
                                    i_slot.date, i_slot.start_time)
                                i_end = datetime.combine(
                                    i_slot.date, i_slot.end_time)
                                if i_start <= hour and hour + timedelta(hours=1) <= i_end:
                                    temp.append({
                                        "id": invitee.id,
                                        "first_name": invitee.first_Name,
                                        "last_name": invitee.last_Name,
                                        "start_time": hour,
                                        "end_time": hour + timedelta(hours=1)
                                    })
                                    blocked[hour] = True
                                    assigned[invitee.id] = True
                                    break
                            if assigned[invitee.id]:
                                break
                    if assigned[invitee.id]:
                        break
        for invitee in invitees:
            if not assigned[invitee.id]:
                for obj in o_availability:
                    start = datetime.combine(obj.date, obj.start_time.replace(
                        second=0, microsecond=0, minute=0, hour=obj.start_time.hour+1))
                    end = datetime.combine(obj.date, obj.end_time.replace(
                        second=0, microsecond=0, minute=0))
                    for hour in hourly_f_it(start, end):
                        if hour not in blocked:
                            for i_slot in i_availability_2[invitee.id]:
                                i_start = datetime.combine(
                                    i_slot.date, i_slot.start_time)
                                i_end = datetime.combine(
                                    i_slot.date, i_slot.end_time)
                                if i_start <= hour and hour + timedelta(hours=1) <= i_end:
                                    temp.append({
                                        "id": invitee.id,
                                        "first_name": invitee.first_Name,
                                        "last_name": invitee.last_Name,
                                        "start_time": hour,
                                        "end_time": hour + timedelta(hours=1)
                                    })
                                    blocked[hour] = True
                                    assigned[invitee.id] = True
                                    break
                            if assigned[invitee.id]:
                                break
                    if assigned[invitee.id]:
                        break
        for invitee in invitees:
            if not assigned[invitee.id]:
                for obj in o_availability:
                    start = datetime.combine(obj.date, obj.start_time.replace(
                        second=0, microsecond=0, minute=0, hour=obj.start_time.hour+1))
                    end = datetime.combine(obj.date, obj.end_time.replace(
                        second=0, microsecond=0, minute=0))
                    for hour in hourly_f_it(start, end):
                        if hour not in blocked:
                            for i_slot in i_availability_1[invitee.id]:
                                i_start = datetime.combine(
                                    i_slot.date, i_slot.start_time)
                                i_end = datetime.combine(
                                    i_slot.date, i_slot.end_time)
                                if i_start <= hour and hour + timedelta(hours=1) <= i_end:
                                    temp.append({
                                        "id": invitee.id,
                                        "first_name": invitee.first_Name,
                                        "last_name": invitee.last_Name,
                                        "start_time": hour,
                                        "end_time": hour + timedelta(hours=1)
                                    })
                                    blocked[hour] = True
                                    assigned[invitee.id] = True
                                    break
                            if assigned[invitee.id]:
                                break
                    if assigned[invitee.id]:
                        break
        all_assigned = True
        for key in assigned:
            if not assigned[key]:
                all_assigned = False
                break
        if all_assigned:
            result.append(temp)

        def hourly_r_it(start, finish):
            while finish > start:
                finish = finish - timedelta(hours=1)
                yield finish

        for key in assigned:
            assigned[key] = False
        temp = []
        blocked = {}
        o_availability = reversed(list(Owner_Availability.objects.get(
            user=user, calendar=calendar).slots.all()))
        for invitee in invitees:
            if not assigned[invitee.id]:
                for obj in o_availability:
                    if obj.start_time.minute == 0:
                        start = datetime.combine(obj.date, obj.start_time.replace(
                            second=0, microsecond=0, minute=0))
                    else:
                        start = datetime.combine(obj.date, obj.start_time.replace(
                            second=0, microsecond=0, minute=0, hour=obj.start_time.hour+1))

                    end = datetime.combine(obj.date, obj.end_time.replace(
                        second=0, microsecond=0, minute=0))

                    for hour in hourly_r_it(start, end):
                        if hour not in blocked:
                            for i_slot in i_availability_3[invitee.id]:
                                i_start = datetime.combine(
                                    i_slot.date, i_slot.start_time)
                                i_end = datetime.combine(
                                    i_slot.date, i_slot.end_time)
                                if i_start <= hour and hour + timedelta(hours=1) <= i_end:
                                    temp.append({
                                        "id": invitee.id,
                                        "first_name": invitee.first_Name,
                                        "last_name": invitee.last_Name,
                                        "start_time": hour,
                                        "end_time": hour + timedelta(hours=1)
                                    })
                                    blocked[hour] = True
                                    assigned[invitee.id] = True
                                    break
                            if assigned[invitee.id]:
                                break
                    if assigned[invitee.id]:
                        break
        for invitee in invitees:
            if not assigned[invitee.id]:
                for obj in o_availability:
                    start = datetime.combine(obj.date, obj.start_time.replace(
                        second=0, microsecond=0, minute=0, hour=obj.start_time.hour+1))
                    end = datetime.combine(obj.date, obj.end_time.replace(
                        second=0, microsecond=0, minute=0))
                    for hour in hourly_r_it(start, end):
                        if hour not in blocked:
                            for i_slot in i_availability_2[invitee.id]:
                                i_start = datetime.combine(
                                    i_slot.date, i_slot.start_time)
                                i_end = datetime.combine(
                                    i_slot.date, i_slot.end_time)
                                if i_start <= hour and hour + timedelta(hours=1) <= i_end:
                                    temp.append({
                                        "id": invitee.id,
                                        "first_name": invitee.first_Name,
                                        "last_name": invitee.last_Name,
                                        "start_time": hour,
                                        "end_time": hour + timedelta(hours=1)
                                    })
                                    blocked[hour] = True
                                    assigned[invitee.id] = True
                                    break
                            if assigned[invitee.id]:
                                break
                    if assigned[invitee.id]:
                        break
        for invitee in invitees:
            if not assigned[invitee.id]:
                for obj in o_availability:
                    start = datetime.combine(obj.date, obj.start_time.replace(
                        second=0, microsecond=0, minute=0, hour=obj.start_time.hour+1))
                    end = datetime.combine(obj.date, obj.end_time.replace(
                        second=0, microsecond=0, minute=0))
                    for hour in hourly_r_it(start, end):
                        if hour not in blocked:
                            for i_slot in i_availability_3[invitee.id]:
                                i_start = datetime.combine(
                                    i_slot.date, i_slot.start_time)
                                i_end = datetime.combine(
                                    i_slot.date, i_slot.end_time)
                                if i_start <= hour and hour + timedelta(hours=1) <= i_end:
                                    temp.append({
                                        "id": invitee.id,
                                        "first_name": invitee.first_Name,
                                        "last_name": invitee.last_Name,
                                        "start_time": hour,
                                        "end_time": hour + timedelta(hours=1)
                                    })
                                    blocked[hour] = True
                                    assigned[invitee.id] = True
                                    break
                            if assigned[invitee.id]:
                                break
                    if assigned[invitee.id]:
                        break
        all_assigned = True
        for key in assigned:
            if not assigned[key]:
                all_assigned = False
                break
        if all_assigned:
            result.append(temp)

        return result

    def create_response(self, calendar, user):
        response = {}
        response['id'] = calendar.id
        response['name'] = calendar.name
        response['description'] = calendar.description
        response['deadline'] = calendar.deadline
        response['invitees'] = []
        for invitee in calendar.invitees.all():
            invitee_data = {}
            invitee_data['id'] = invitee.id
            invitee_data['first_name'] = invitee.first_Name
            invitee_data['last_name'] = invitee.last_Name
            response['invitees'].append(invitee_data)
        response['suggested_schedules'] = self.suggest_schedule(calendar, user)
        response['invitee_availability'] = []
        for invitee in calendar.invitees.all():
            temp = {}
            invitee_data = {}
            invitee_data['id'] = invitee.id
            invitee_data['first_name'] = invitee.first_Name
            invitee_data['last_name'] = invitee.last_Name
            temp['contact'] = invitee_data
            temp['availability'] = []
            for slot in Invitee_Availability.objects.get(contact=invitee, calendar=calendar).slots.all():
                slot_data = {}
                slot_data['date'] = slot.date
                slot_data['start_time'] = slot.start_time
                slot_data['end_time'] = slot.end_time
                slot_data['preference_level'] = slot.preference_level
                temp['availability'].append(slot_data)
            response['invitee_availability'].append(temp)
        return response

    def get(self, request, calendar_id):
        user = request.user
        calendar = get_object_or_404(Calendar, id=calendar_id)
        if calendar.owner != user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if calendar.finalized:
            data = {'error': 'Calendar is already finalized'}
            return Response(data, status=status.HTTP_404_NOT_FOUND)
        data = self.create_response(calendar, user)
        return Response(data, status=status.HTTP_200_OK)

    def check_post(self, data, calendar, user):
        meetings = data['finalized_schedule']
        blocked = {}
        for m in meetings:
            if not Contact.objects.filter(id=m['contact_id'], owner=user).exists():
                data = {'error': 'Invalid contact id'}
                return data, False

            c = Contact.objects.get(id=m['contact_id'])
            if c not in calendar.invitees.all():
                data = {'error': 'Contact not invited to calendar'}
                return data, False

            if m['start_time'] in blocked:
                data = {'error': 'Meeting times overlap'}
                return data, False
            blocked[m['start_time']] = True

        for m in meetings:
            m['start_time'] = datetime.strptime(
                m['start_time'], '%Y/%m/%d %H:%M:%S')
            m['end_time'] = datetime.strptime(
                m['end_time'], '%Y/%m/%d %H:%M:%S')
            c = Contact.objects.get(id=m['contact_id'])
            if Invitee_Availability.objects.get(contact=c, calendar=calendar).status:
                slots = Invitee_Availability.objects.get(
                    contact=c, calendar=calendar).slots.all()
                valid_time = False
                for s in slots:
                    start = datetime.combine(s.date, s.start_time)
                    end = datetime.combine(s.date, s.end_time)
                    if m['start_time'] >= start and m['end_time'] <= end:
                        valid_time = True
                        break
                if not valid_time:
                    data = {'error': f'Invalid meeting time for contact: {c.id}'}
                    return data, False

        return {}, True

    def generate_email_body(self, user, meeting: Meeting):
        date = meeting.start_time.strftime("%Y-%m-%d")
        start_time = meeting.start_time.strftime("%H:%M")
        end_time = meeting.end_time.strftime("%H:%M")
        result = f"""
        <html>
        <body>
        <p>Hello {meeting.contact.first_Name} {meeting.contact.last_Name},</p>
        <p>You have a meeting scheduled with <strong>{user.first_name} {user.last_name}</strong> on <strong>{date}</strong> from <strong>{start_time} to {end_time}</strong>. 
        <p>Best,</p>
        <p>OneOnOne Team<p>"""
        return result

    def create_icalendar(self, user, calendar: Calendar, meeting: Meeting):
        cal = icalendar.Calendar()
        cal.add('prodid', '-//Meeting Set//OneOnOne.com//')
        cal.add('version', '2.0')
        cal.add('summary', calendar.name)
        cal.add('description', calendar.description)

        event = icalendar.Event()
        event.add('name', calendar.name)
        event.add('summary', calendar.name)
        event.add('description', calendar.description)
        event.add('dtstart', meeting.start_time.replace(tzinfo=pytz.timezone('US/Eastern')))
        event.add('dtend', meeting.end_time.replace(tzinfo=pytz.timezone('US/Eastern')))

        organizer = icalendar.vCalAddress(f'MAILTO:{user.email}')
        organizer.params['name'] = icalendar.vText(
            f'{user.first_name} {user.last_name}')
        organizer.params['role'] = icalendar.vText('Organizer')
        event['organizer'] = organizer
        cal['organizer'] = organizer

        event['uid'] = f'{meeting.id}'
        attendee = icalendar.vCalAddress(f'MAILTO:{meeting.contact.email}')
        attendee.params['name'] = icalendar.vText(
            f'{meeting.contact.first_Name} {meeting.contact.last_Name}')
        attendee.params['role'] = icalendar.vText('Participant')
        event.add('attendee', attendee, encode=0)
        cal.add('attendee', attendee, encode=0)

        cal.add_component(event)

        f = open(f'invite{meeting.id}.ics', 'wb')
        f.write(cal.to_ical())
        f.close()
        return f'invite{meeting.id}.ics'

    def delete_icalendar(self, name):
        if os.path.exists(name):
            os.remove(name)

    def post(self, request, calendar_id):
        user = request.user
        calendar = get_object_or_404(Calendar, id=calendar_id)
        if calendar.owner != user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if calendar.finalized:
            data = {'error': 'Calendar is already finalized'}
            return Response(data, status=status.HTTP_404_NOT_FOUND)
        if 'finalized_schedule' not in request.data:
            data = {'error': 'Missing Fields'}
            return Response(data, status=status.HTTP_400_BAD_REQUEST)
        for m in request.data['finalized_schedule']:
            serializer = FinalizeCalendarCheckSerializer(data=m)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data, valid = self.check_post(request.data, calendar, user)

        if not valid:
            return Response(data, status=status.HTTP_400_BAD_REQUEST)
        result = {'meetings': []}
        for m in request.data['finalized_schedule']:
            new_meeting = {
                'calendar': calendar.id,
                'contact': m['contact_id'],
                'start_time': m['start_time'],
                'end_time': m['end_time']
            }
            serializer = MeetingSerializer(data=new_meeting)
            if serializer.is_valid():
                meeting = serializer.save()
                icalendar_file = self.create_icalendar(user, calendar, meeting)

                email_body = self.generate_email_body(user, meeting)
                email = EmailMessage(
                    "Meeting Scheduled",
                    email_body,
                    "csc309group1234@gmail.com",
                    [meeting.contact.email]
                )
                email.content_subtype = "html"
                email.attach_file(icalendar_file, 'text/calendar')
                email.send()

                self.delete_icalendar(icalendar_file)

                result['meetings'].append(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        calendar.finalized = True
        calendar.save()
        return Response(result, status=status.HTTP_200_OK)

class GetMeetingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, calendar_id):
        user = request.user
        calendar = get_object_or_404(Calendar, id=calendar_id)
        if calendar.owner != user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        meetings = Meeting.objects.filter(calendar=calendar_id)
        all_meetings = []
        for m in meetings:
            meeting = MeetingSerializer(m).data
            contact = Contact.objects.get(id = meeting["contact"])
            all_meetings.append(
                {
                    "id": meeting["contact"],
                    "first_name": contact.first_Name,
                    "last_name": contact.last_Name,
                    "start_time": meeting["start_time"][:-1],
                    "end_time": meeting["end_time"][:-1],
                }
            )
                
        return Response(all_meetings)

class RemindCalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def generate_email_body(self, user, invitee_avail):
        deadline_date = invitee_avail.calendar.deadline.strftime("%Y-%m-%d")
        deadline_time = invitee_avail.calendar.deadline.strftime("%H:%M")
        result = f"""
        <html>
        <body>
        <p>Hello {invitee_avail.contact.first_Name} {invitee_avail.contact.last_Name},</p>

        <p>Don't forget to fill out your availability for your <strong>{invitee_avail.calendar.name}</strong> meeting with <strong>{user.first_name} {user.last_name}</strong> by <strong>{deadline_date} at {deadline_time}</strong>.</p>
        
        <p><a href="{invitee_avail.link}">Click me!</a></p>

        <p>Regards,</p>
        <p>OneOnOne Team</p>
        </body>
        </html>
        """
        return result

    def get(self, request, calendar_id, contact_id):
        user = request.user
        calendar = get_object_or_404(Calendar, id=calendar_id)
        contact = get_object_or_404(Contact, id=contact_id)
        invitee_avail = get_object_or_404(
            Invitee_Availability, contact=contact_id, calendar=calendar_id)
        sent = {
            'message': f"Reminder email successfully sent to {contact.first_Name} {contact.last_Name}"
        }
        fail = {
            'message': f"{contact.first_Name} {contact.last_Name} has already responded"
        }
        if calendar.owner != user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if not invitee_avail.status:
            email_body = self.generate_email_body(user, invitee_avail)
            send_mail("Meeting Reminder", strip_tags(email_body), "csc309group1234@gmail.com",
                      [contact.email], html_message=email_body, fail_silently=False)
            return Response(sent)
        else:
            return Response(fail)
