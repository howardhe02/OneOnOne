from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Contact
from .serializers import *
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404


# Create your views here.

class UserContactsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        contacts = Contact.objects.filter(owner = user)
        serializer = ContactSerializer(contacts, many=True)


        return Response(serializer.data)

    def post(self, request):
        user = request.user

        data = request.data
        data['owner'] = user.id

        serializer = ContactSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner = user)
            return Response(serializer.data, status = status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

    def delete(self, request):
        contact_id = request.data.get('contact_id')
        contact = get_object_or_404(Contact, pk = contact_id)
        if contact.owner !=  request.user:
            return Response({"You do not have permission to delete this contact."}, status=status.HTTP_403_FORBIDDEN)
        
        contact.delete()

        return Response({"Contact deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    

    def put(self, request):
        contact_id = request.data.get('contact_id')
        contact = get_object_or_404(Contact, pk = contact_id)
        if contact.owner !=  request.user:
            return Response({"You do not have permission to delete this contact."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ContactSerializer(contact, data=request.data, partial = True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)