import json

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from django.utils.timesince import timesince

from chat.templatetags.chatextras import initials

from chat.models import Room, Message

from account.models import User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "chat_{}".format(self.room_name)
        self.user = self.scope["user"]

        await self.get_room()
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        if self.user.is_staff:
            await self.channel_layer.group_send(
                self.room_group_name, 
                {
                    "type": "user_update"
                }
            )

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if not self.user.is_staff:
            await self.set_room_close()
            

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        type = text_data_json["type"]
        name = text_data_json["name"]
        message = text_data_json["message"]
        agent = text_data_json.get("agent", "")

        if type == "message":

            new_message = await self.create_message(message, name, agent)

            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type": "chat_message",
                    "name": name,
                    "message": message,
                    "agent": agent,
                    "initials": initials(name),
                    "created_at": timesince(new_message.created_at)
                }
            )
        elif type == "update":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "writing_active",
                    "name": name,
                    "message": message,
                    "agent": agent,
                    "initials": initials(name),
                }
            )

    async def writing_active(self, event):
        await self.send(text_data=json.dumps({
            "type": event["type"],
            "name": event["name"],
            "message": event["message"],
            "agent": event["agent"],
            "initials": event["initials"]      
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": event["type"],
            "name": event["name"],
            "message": event["message"],
            "agent": event["agent"],
            "initials": event["initials"],
            "created_at": event["created_at"],
        }))

    async def user_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "user_update"
        }))

    @sync_to_async
    def get_room(self):
        self.room = Room.objects.get(uuid=self.room_name)

    @sync_to_async
    def set_room_close(self):
        self.room = Room.objects.get(uuid=self.room_name)
        self.room.status = Room.CLOSED
        self.room.save()

    @sync_to_async
    def create_message(self, message, sent_by, agent):
        message = Message.objects.create(body=message, sent_by=sent_by)

        if agent:
            message.created_by = User.objects.get(pk=agent)
            message.save()

        self.room.messages.add(message)
        return message