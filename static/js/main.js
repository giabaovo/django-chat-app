let chatName = ""
let chatSocket = null
let chatUrl = window.location.href
let chatUuid = Math.random().toString(36).slice(2, 12)

const chatElement = document.querySelector("#chat")
const chatIconElement = document.querySelector("#chat_icon")
const chatOpenElement = document.querySelector("#chat_open")
const chatWelcomElement = document.querySelector("#chat_welcome")
const chatJoinElement = document.querySelector("#chat_join")
const chatCloseElement = document.querySelector("#chat_close")
const chatRoomElement = document.querySelector("#chat_room")
const chatNameElement = document.querySelector("#chat_name")
const chatLogElement = document.querySelector("#chat_log")
const chatMessageInputElement = document.querySelector("#chat_message_input")
const chatMessageSubmitElement = document.querySelector("#chat_message_submit")

function scrollToBottom() {
    chatLogElement.scrollTop = chatLogElement.scrollHeight
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function sendMessage() {
    chatSocket.send(JSON.stringify({
        "type": "message",
        "name": chatName,
        "message": chatMessageInputElement.value
    }))

    chatMessageInputElement.value = ""
}

function onChatMessage(data) {
    console.log(data)
    if (data.type === "chat_message") {

        let tmpInfo = document.querySelector('.tmp-info')

        if (tmpInfo) {
            tmpInfo.remove()
        }

        if (data.agent) {
            chatLogElement.innerHTML += `
                <div class="flex w-full mt-2 space-x-3 max-w-md">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>

                    <div>
                        <div class="bg-gray-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">${data.message}</p>
                        </div>
                        
                        <span class="text-xs text-gray-500 leading-none">${data.created_at} ago</span>
                    </div>
                </div>
            `
        } else {
            chatLogElement.innerHTML += `
                <div class="flex w-full mt-2 space-x-3 max-w-md ml-auto justify-end">
                    <div>
                        <div class="bg-blue-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">${data.message}</p>
                        </div>
                        
                        <span class="text-xs text-gray-500 leading-none">${data.created_at} ago</span>
                    </div>

                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>
                </div>
            `
        }
    } else if(data.type === "user_update") {
        chatLogElement.innerHTML += '<p class="mt-2">The admin/agent has joined the chat!'
    } else if(data.type === "writing_active") {
        if (data.agent) {
            let tmpInfo = document.querySelector('.tmp-info')

            if (tmpInfo) {
                tmpInfo.remove()
            }

            chatLogElement.innerHTML += `
                <div class="tmp-info flex w-full mt-2 space-x-3 max-w-md">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>

                    <div>
                        <div class="bg-gray-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">The agent/admin is writing a message</p>
                        </div>
                    </div>
                </div>
            `
        }
    }

    scrollToBottom()
}

async function joinChatRoom() {

    chatName = chatNameElement.value

    const data = new FormData()
    data.append("name", chatName)
    data.append("url", chatUrl)

    await fetch(`/api/create-room/${chatUuid}/`, {
        method: 'POST',
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: data
    })
    .then(function(res) {
        return res.json()
    })
    .then(function(data){
        console.log(data)
    })


    chatSocket = new WebSocket(`ws://${window.location.host}/ws/${chatUuid}/`)

    chatSocket.onmessage = function(e) {
        console.log("On message")
        onChatMessage(JSON.parse(e.data))
    }

    chatSocket.onopen = function(e) {
        scrollToBottom()
    }

    chatSocket.onclose = function(e) {
        console.log("Websocket close")
    }
}

chatOpenElement.onclick = function(e) {
    e.preventDefault()

    chatIconElement.classList.add("hidden")
    chatWelcomElement.classList.remove("hidden")

}

chatCloseElement.onclick = function(e) {
    e.preventDefault()

    chatIconElement.classList.remove("hidden")
    chatWelcomElement.classList.add("hidden")

}

chatJoinElement.onclick = function(e) {
    e.preventDefault()

    chatWelcomElement.classList.add("hidden")
    chatRoomElement.classList.remove("hidden")

    joinChatRoom()
}

chatMessageSubmitElement.onclick = function(e) {
    e.preventDefault()

    if (chatMessageInputElement.value === "") {

    } else {
        sendMessage() 
    }
}

chatMessageInputElement.onkeyup = function (e) {
    if (e.keyCode == 13) {
        if (chatMessageInputElement.value === "") {

        } else {
            sendMessage()
        }
    }
}

chatMessageInputElement.onfocus = function(e) {
    chatSocket.send(JSON.stringify({
        'type': 'update',
        'message': 'writing_active',
        'name': chatName
    }))
}