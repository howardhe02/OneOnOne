from django.db import models

from django.contrib.auth.models import User

# Create your models here.


class Contact(models.Model):
    first_Name = models.CharField(max_length=150)
    last_Name = models.CharField(max_length=150)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    email = models.EmailField()

    class Meta:
        unique_together = ('owner', 'email')

    def __str__(self):
        return str(self.id) + " - " + self.first_Name + " " + self.last_Name


class Calendar(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    description = models.CharField(max_length=200)
    deadline = models.DateTimeField()
    invitees = models.ManyToManyField(Contact)
    finalized = models.BooleanField(default=False)

    def __str__(self):
        return str(self.id) + " - " + self.name + " " + str(self.deadline)


class Available_Slot(models.Model):
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    preference_level = models.IntegerField(choices=((1, 1), (2, 2), (3, 3)))

    def __str__(self):
        return str(self.id) + " - " + str(self.date) + " " + str(self.preference_level)
    # idk if that works


class Meeting(models.Model):
    calendar = models.ForeignKey(Calendar, on_delete=models.CASCADE)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()


class Owner_Availability(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    calendar = models.ForeignKey(Calendar, on_delete=models.CASCADE)
    slots = models.ManyToManyField(Available_Slot)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'calendar'], name='user_calendar_unique')
        ]

    def __str__(self):
        return str(self.id) + " - " + (self.calendar.name) + " by " + str(self.user)


class Invitee_Availability(models.Model):
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    calendar = models.ForeignKey(Calendar, on_delete=models.CASCADE)
    link = models.CharField(max_length=200)
    status = models.BooleanField(default=False)
    slots = models.ManyToManyField(Available_Slot)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['contact', 'calendar'], name='contact_calendar_unique')
        ]
