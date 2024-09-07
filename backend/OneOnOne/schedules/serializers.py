from rest_framework import serializers
from django.core.exceptions import ObjectDoesNotExist
from .models import *
from datetime import datetime, date, timedelta
import re
from django.utils import timezone
from django.core.mail import send_mail
from django.urls import reverse
from django.conf import settings
import jwt
from urllib.parse import quote
from django.utils.html import strip_tags

# expiry time for token to be 365 days
expiry_time = datetime.utcnow() + timedelta(days=365)
ONE_YEAR = int(expiry_time.timestamp())


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ["id", "first_Name", "last_Name", "email"]

    def validate(self, data):
        if not data:
            raise serializers.ValidationError("No input.")
        return data

    def validate_email(self, value):
        request = self.context.get('request')

        if request and request.user:
            if request and request.user:
                if Contact.objects.filter(owner=request.user, email=value).exists():
                    raise serializers.ValidationError(
                        "A contact with this email already exists.")
        return value


class Available_SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Available_Slot
        fields = ["id", "date", "start_time", "end_time", "preference_level"]


class Owner_AvailabilitySerializer(serializers.ModelSerializer):
    slots = Available_SlotSerializer(many=True)

    class Meta:
        model = Owner_Availability
        fields = ["slots"]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        slots_data = representation.pop('slots')
        slots_representation = Available_SlotSerializer(
            slots_data, many=True).data
        representation['slots'] = slots_representation
        return representation


class Invitee_AvailabilitySerializer(serializers.ModelSerializer):
    contact = ContactSerializer()
    slots = Available_SlotSerializer(many=True)

    class Meta:
        model = Invitee_Availability
        fields = ["contact", "status", "slots"]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        slots_data = representation.pop('slots')
        slots_representation = Available_SlotSerializer(
            slots_data, many=True).data
        representation['slots'] = slots_representation
        return representation


class ViewCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendar
        fields = ["id", "name", "description",
                  "deadline", "invitees", "finalized"]


def invite_email_body(contact: Contact, calendar: Calendar, link):
    body = f"""
    <html>
    <body>
        <p>Dear {contact.first_Name} {contact.last_Name},</p>
        <p>You are invited to the following meeting with {calendar.owner.first_name} {calendar.owner.last_name}:</p>
        <ul>
            <li><strong>Meeting name:</strong> {calendar.name}</li>
            <li><strong>Meeting description:</strong> {calendar.description}</li>
        </ul>
        <p>Please respond by {calendar.deadline} using the link below:</p>
        <p><a href="{link}">Response link</a></p>
        <br/>
        <p>Best,</p>
        <p>OneOnOne Team<p>
    </body>
    </html>
    """
    return body


class CreateCalendarSerializer(serializers.ModelSerializer):
    available_slots = serializers.ListField(child=serializers.DictField(),
                                            write_only=True)

    class Meta:
        model = Calendar
        fields = ["id", "name", "description", "deadline", "invitees",
                  "available_slots"]

    def validate_deadline(self, value):
        current_datetime = timezone.now()
        if value < current_datetime:
            raise serializers.ValidationError(
                "Deadline cannot be in the past.")
        return value

    def validate_invitees(self, value):
        request_user = self.context['request'].user

        for contact_id in value:
            try:
                contact = Contact.objects.get(id=contact_id.id)
                if contact.owner != request_user:
                    raise serializers.ValidationError("Invalid contact id.")
            except ObjectDoesNotExist:
                raise serializers.ValidationError("Contact does not exist.")
        return value

    def validate_available_slots(self, value):
        current_date = date.today()

        for slot_data in value:
            if not all(key in slot_data for key in
                       ["date", "start_time", "end_time", "preference_level"]):
                raise serializers.ValidationError(
                    "Invalid slot data. Must be in the form: 'date'," +
                    "'start_time', 'end_time', 'preference_level' ")

            # date validation
            if not isinstance(slot_data['date'], str):
                raise serializers.ValidationError('Date must be a string.')
            date_format = r'\d{4}-\d{2}-\d{2}'
            if not re.match(date_format, slot_data['date']):
                raise serializers.ValidationError(
                    'Date must be in a valid date format YYYY-MM-DD.')
            slot_date = datetime.strptime(slot_data['date'], '%Y-%m-%d').date()
            if slot_date < current_date:
                raise serializers.ValidationError(
                    'Available date cannot be in the past.')

            # start and end time validation
            for time_field in ['start_time', 'end_time']:
                if not isinstance(slot_data[time_field], str):
                    raise serializers.ValidationError(
                        'Start and end times must be strings.')
                try:
                    datetime.strptime(slot_data[time_field], '%H:%M:%S')
                except ValueError:
                    raise serializers.ValidationError(
                        'Start and end times must be in a valid date format' +
                        ' HH:MM:SS.')
            start_time = datetime.strptime(slot_data['start_time'],
                                           '%H:%M:%S').time()
            end_time = datetime.strptime(slot_data['end_time'],
                                         '%H:%M:%S').time()
            if end_time < start_time:
                raise serializers.ValidationError(
                    'End time must be after start time.')

            # preference level validation
            preference_level = slot_data['preference_level']
            if not isinstance(preference_level, int):
                raise serializers.ValidationError(
                    "Preference level must be an integer.")
            if preference_level not in [1, 2, 3]:
                raise serializers.ValidationError(
                    "Preference level must be either 1, 2, or 3 " +
                    "(3 being highest preference).")

        return value

    def create(self, validated_data):
        available_slots_data = validated_data.pop("available_slots")
        invitees_data = validated_data.pop('invitees')
        calendar = Calendar.objects.create(**validated_data)

        slots = []
        for slot_data in available_slots_data:
            slot = Available_Slot.objects.create(**slot_data)
            slots.append(slot)

        owner_availability = Owner_Availability.objects.create(
            user=calendar.owner, calendar=calendar)
        owner_availability.slots.set(slots)

        calendar.invitees.set(invitees_data)

        for invitee in invitees_data:
            contact = Contact.objects.get(id=invitee.id)
            invitee_availability = Invitee_Availability.objects.create(
                contact=contact,
                calendar=calendar
            )
            contact = Contact.objects.get(id=invitee.id)
            token = jwt.encode(
                {"invitee_availability_id": invitee_availability.id},
                settings.JWT_SECRET_KEY, algorithm="HS256")
            calendar_id = calendar.id
            url = reverse('calendars_respond', kwargs={
                          'calendar_id': calendar_id, "token": quote(token)})
            base = "http://localhost:3000"
            link = f"{base}{url}"
            body = invite_email_body(contact, calendar, link)
            send_mail('Meeting invitation', strip_tags(body),
                      'uoft@mail.utoronto.ca',
                      [contact.email], html_message=body)
            invitee_availability.link = link
            invitee_availability.save()
        return calendar


class UpdateCalendarSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    description = serializers.CharField(required=False)
    deadline = serializers.DateTimeField(required=False)
    add_invitees = serializers.ListField(
        child=serializers.IntegerField(), required=False)
    remove_invitees = serializers.ListField(
        child=serializers.IntegerField(), required=False)
    add_availabilities = serializers.ListSerializer(
        child=Available_SlotSerializer(), required=False)
    remove_availabilities = serializers.ListField(
        child=serializers.IntegerField(), required=False)

    class Meta:
        model = Calendar
        fields = ["id", "name", "description", "deadline", "add_invitees",
                  "remove_invitees", "add_availabilities", "remove_availabilities"]

    def validate_deadline(self, value):
        current_datetime = timezone.now()
        if value < current_datetime:
            raise serializers.ValidationError(
                "Deadline cannot be in the past.")
        return value

    def validate_add_invitees(self, value):
        request_user = self.context['request'].user
        existing_invitees = self.instance.invitees.values_list('id', flat=True)

        for contact_id in value:
            try:
                contact = Contact.objects.get(id=contact_id)
                if contact.owner != request_user:
                    raise serializers.ValidationError(
                        "You do not have permission to add this contact.")
                if contact_id in existing_invitees:
                    raise serializers.ValidationError(
                        "This contact is already invited.")
            except ObjectDoesNotExist:
                raise serializers.ValidationError("Contact does not exist.")
        return value

    def validate_add_availabilities(self, value):
        current_date = date.today()

        for slot_data in value:
            if not all(key in slot_data for key in
                       ["date", "start_time", "end_time", "preference_level"]):
                raise serializers.ValidationError(
                    "Invalid slot data. Must be in the form: 'date'," +
                    "'start_time', 'end_time', 'preference_level' ")

            # date validation
            slot_date = slot_data["date"]
            if slot_date < current_date:
                raise serializers.ValidationError(
                    'Available cannot be in the past.')

            # start and end time validation
            start_time = slot_data['start_time']
            end_time = slot_data['end_time']
            if end_time < start_time:
                raise serializers.ValidationError(
                    'End time must be after start time.')

            # preference level validation
            preference_level = slot_data['preference_level']
            if not isinstance(preference_level, int):
                raise serializers.ValidationError(
                    "Preference level must be an integer.")
            if preference_level not in [1, 2, 3]:
                raise serializers.ValidationError(
                    "Preference level must be either 1, 2, or 3 " +
                    "(3 being highest preference).")

        return value

    def update(self, instance, validated_data):
        add_invitees = validated_data.pop('add_invitees', [])
        remove_invitees = validated_data.pop('remove_invitees', [])
        add_availabilities = validated_data.pop('add_availabilities', [])
        remove_availabilities = validated_data.pop('remove_availabilities', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        for invitee_id in add_invitees:
            # add them to list of invitees
            instance.invitees.add(invitee_id)
            # make a new invitee_availability object and send an email
            contact = Contact.objects.get(id=invitee_id)
            invitee_availability = Invitee_Availability.objects.create(
                contact=contact,
                calendar=instance,
            )
            contact = Contact.objects.get(id=invitee_id)
            token = jwt.encode(
                {"invitee_availability_id": invitee_availability.id},
                settings.JWT_SECRET_KEY, algorithm="HS256")
            calendar_id = instance.id
            url = reverse('calendars_respond', kwargs={
                          'calendar_id': calendar_id, "token": quote(token)})

            base = "http://localhost:3000"
            link = f"{base}{url}"
            body = invite_email_body(contact, instance, link)
            send_mail('Meeting invitation', strip_tags(body),
                      'uoft@mail.utoronto.ca',
                      [contact.email], html_message=body)
            invitee_availability.link = link
            invitee_availability.save()

        for invitee_id in remove_invitees:
            instance.invitees.remove(invitee_id)
            print(instance.id, invitee_id)
            inv_avai = Invitee_Availability.objects.get(
                calendar=instance.id, contact=invitee_id)
            inv_avai.delete()

        new_slots = []
        for slot_data in add_availabilities:
            new_slot = Available_Slot.objects.create(**slot_data)
            new_slots.append(new_slot)
        owner_availability = Owner_Availability.objects.get(calendar=instance)
        owner_availability.slots.add(*new_slots)

        for slot_id in remove_availabilities:
            owner_availability.slots.remove(slot_id)
        instance.save()

        return instance


class FinalizeCalendarCheckSerializer(serializers.Serializer):
    contact_id = serializers.IntegerField()
    start_time = serializers.CharField()
    end_time = serializers.CharField()

    def validate(self, data):
        try:
            data['start_time'] = datetime.strptime(
                data['start_time'], '%Y/%m/%d %H:%M:%S')
        except:
            raise serializers.ValidationError('Invalid start time format.')

        try:
            data['end_time'] = datetime.strptime(
                data['end_time'], '%Y/%m/%d %H:%M:%S')
        except:
            raise serializers.ValidationError('Invalid end time format.')

        return data


class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ["calendar", "contact", "start_time", "end_time"]


class AvailabilitySerializer(serializers.Serializer):
    start_time = serializers.CharField()
    end_time = serializers.CharField()
    preference_level = serializers.IntegerField()

    def validate(self, data):
        try:
            dt = datetime.strptime(
                data['start_time'], '%Y/%m/%d %H:%M:%S')
            data['start_time'] = dt.time()
            data['date'] = dt.date()
        except:
            raise serializers.ValidationError('Invalid start time format.')

        try:
            data['end_time'] = datetime.strptime(
                data['end_time'], '%Y/%m/%d %H:%M:%S').time()
        except:
            raise serializers.ValidationError('Invalid end time format.')

        if not (1 <= data['preference_level'] <= 3):
            raise serializers.ValidationError('Invalid preference level.')

        return data

    def create(self, validated_data):
        return Available_Slot.objects.create(**validated_data)


class InviteeResponseSerializer(serializers.Serializer):
    availability = serializers.ListSerializer(child=AvailabilitySerializer())
