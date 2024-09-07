from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Contact, Meeting, Calendar
from .serializers import *
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404


# Create your views here.    
class HomeView(APIView):
    permission_classes = [IsAuthenticated]

    def create_response(self, all_calendars, user):
        response = {}
        response['unfinalized_meetings'] = []
        response['finalized_meetings'] = []
        for calendar in all_calendars:
            if calendar.owner == user:
                if calendar.finalized == True:
                    response['finalized_meetings'].append({
                    "id": calendar.id,
                    "name": calendar.name,
                    "description": calendar.description,
                    "deadline": calendar.deadline
                }) 
                else:
                    response['unfinalized_meetings'].append({
                    "id": calendar.id,
                    "name": calendar.name,
                    "description": calendar.description,
                    "deadline": calendar.deadline
                })
        return response

    def get(self, request):
        user = request.user
        all_calendars = Calendar.objects.all()
        meetings = Meeting.objects.all()
        data = self.create_response(all_calendars, user)
        return Response(data)
