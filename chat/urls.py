from django.urls import path

from . import views

urlpatterns = [
    path("api/create-room/<str:uuid>/", views.create_room, name="create-room"),
    path("chat-admin/", views.admin, name="chat-admin"),
    path("chat-admin/room/<str:uuid>/", views.room, name="chat-admin-room"),
    path("chat-admin/add-user/", views.add_user, name="chat-admin-add-user"),
    path("chat-admin/user-detail/<uuid:uuid>/", views.user_detail, name="chat-admin-user-detail"),
    path("chat-admin/edit-user/<uuid:uuid>/", views.edit_user, name="chat-admin-edit-user"),
    path("chat-admin/delete-room/<str:uuid>/", views.delete_room, name="chat-admin-delete-room"),
]
