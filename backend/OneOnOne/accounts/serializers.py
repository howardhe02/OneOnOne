from rest_framework import serializers
from django.contrib.auth.models import User


class UserRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField()
    password2 = serializers.CharField()

    def validate(self, data):
        if len(data["password"]) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long.")
        if data["password"] != data["password2"]:
            raise serializers.ValidationError("Passwords must match.")
        if User.objects.filter(username=data["username"]).exists():
            raise serializers.ValidationError("Username already taken.")
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            password=validated_data["password"]
        )
        return user


class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
