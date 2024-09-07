from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.views import APIView
from .serializers import *
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

# Create your views here.


class UserRegisterView(APIView):

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            info_serializer = UserInfoSerializer(user)
            return Response(info_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CheckTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(status=status.HTTP_200_OK)
