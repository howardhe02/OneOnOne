from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(Contact)
admin.site.register(Calendar)
admin.site.register(Available_Slot)
admin.site.register(Meeting)
admin.site.register(Owner_Availability)
admin.site.register(Invitee_Availability)
