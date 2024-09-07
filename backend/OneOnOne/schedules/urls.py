"""
URL configuration for OneOnOne project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.urls import path
from .views_contacts import *
from .views_calendars import *
from .views import HomeView

urlpatterns = [
    #homepage view
    path('home/', HomeView.as_view(), name = "home"),

    # contacts views
    path('contacts/', UserContactsView.as_view(), name="contacts"),

    # calendars views
    path('calendars/<int:calendar_id>/details/', CalendarDetailsView.as_view(), name="calendar_details"),
    path('calendars/create/', CreateCalendarsView.as_view(), name="add_calendars"),
    path('calendars/<int:calendar_id>/confirm/',FinalizeCalendarView.as_view(), name="finalize_calendar"),
    path('calendars/<int:calendar_id>/respond/<token>/', RespondToInviteView.as_view(), name="calendars_respond"),

    path('calendars/remind/<int:calendar_id>/<int:contact_id>/',
         RemindCalendarView.as_view(), name="remind_contact"),
    path('calendars/<int:calendar_id>/meetings/', GetMeetingsView.as_view(), name="meetings"),
]
