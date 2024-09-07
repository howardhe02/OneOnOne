#!/bin/sh
sudo apt-get update
sudo apt-get install python3.8 python3-pip
pip install Django
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers