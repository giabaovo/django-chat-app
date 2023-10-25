import json

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.contrib import messages
from django.contrib.auth.models import Group

from .models import Room

from account.models import User
from account.forms import AddUserForm, EditUserForm

@require_POST
def create_room(request, uuid):
    client_name = request.POST.get("name", "")
    url = request.POST.get("url", "")

    Room.objects.create(uuid=uuid, client=client_name, url=url)

    return JsonResponse({"message": "Room created"})

@login_required
def admin(request):
    rooms = Room.objects.all()
    users = User.objects.filter(is_staff=True)

    paginator = Paginator(rooms, 8)
    page_number = request.GET.get("page")
    page_rooms = paginator.get_page(page_number)

    context = {
        "page_rooms": page_rooms,
        "users": users
    }

    return render(request, "chat/admin.html", context=context)

@login_required
def room(request, uuid):
    room = Room.objects.get(uuid=uuid)

    if room.status == Room.WAITING:
        room.status = Room.ACTIVE
        room.agent = request.user
        room.save()

    context = {
        "room": room
    }

    return render(request, "chat/room.html", context=context)

@login_required
def delete_room(request, uuid):
    if request.user.has_perm("chat.delete_room"):
        room = Room.objects.get(uuid=uuid)
        room.delete()

        messages.success(request, "Room {} delete successfully".format(room.uuid))
        return redirect("chat-admin")
    else:
        messages.error(request, "You don't have permission to delete room")
        return redirect("chat-admin")

@login_required
def add_user(request):
    if request.user.has_perm("account.add_user"):
        if request.method == "POST":
            form = AddUserForm(request.POST)
            if form.is_valid():
                user = form.save(commit=False)
                user.is_staff = True
                user.set_password(request.POST.get("password"))
                user.save()

                if user.role == User.MANAGER:
                    group = Group.objects.get(name="Managers")
                else:
                    group = Group.objects.get(name="Agents")
                group.user_set.add(user)
                messages.success(request, "Adding user successfully")
                return redirect("chat-admin")
        else:
            form = AddUserForm()
        return render(request, "chat/add_user.html", {"form": form})
    else:
        messages.error(request, "You don't have permission to add user")
        return redirect("chat-admin")

@login_required
def user_detail(request, uuid):
    user = User.objects.get(pk=uuid)
    rooms = user.rooms.all()

    paginator = Paginator(rooms, 8)
    page_number = request.GET.get("page")
    page_rooms = paginator.get_page(page_number)

    context = {
        "user": user,
        "page_rooms": page_rooms
    }

    return render(request, "chat/user_detail.html", context=context)

@login_required
def edit_user(request, uuid):
    if request.user.has_perm("account.edit_user"):
        user = User.objects.get(pk=uuid)
        if request.method == "POST":
            form = EditUserForm(request.POST, instance=user)
            if form.is_valid():
                user = form.save()

                if user.role == User.MANAGER:
                    group_add = Group.objects.get(name="Managers")
                    group_remove = Group.objects.get(name="Agents")
                else:
                    group_add = Group.objects.get(name="Agents")
                    group_remove = Group.objects.get(name="Managers")
                group_add.user_set.add(user)
                if user.groups.filter(name=group_remove).exists():
                    group_remove.user_set.remove(user)
                
                messages.success(request, "Update user successfully")
                return redirect("chat-admin")
        else:
            form = EditUserForm(instance=user)
            return render(request, "chat/edit_user.html", {"form": form})
    else:
        messages.error(request, "You don't have permission to edit user")
        return redirect("chat-admin")
    