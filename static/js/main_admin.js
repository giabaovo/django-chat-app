const chatRoom = document.querySelector("#room_uuid").textContent.replaceAll('"', '')
const chatLogElement = document.querySelector("#chat_log")
const chatMessageInputElement = document.querySelector("#chat_message_input")
const chatMessageSubmitElement = document.querySelector("#chat_message_submit")

let chatSocket = null

function scrollToBottom() {
    chatLogElement.scrollTop = chatLogElement.scrollHeight
}

function sendMessage() {
    chatSocket.send(JSON.stringify({
        "type": "message",
        "name": document.querySelector("#user_name").textContent.replaceAll('"', ''),
        "agent": document.querySelector("#user_id").textContent.replaceAll('"', ''),
        "message": chatMessageInputElement.value
    }))

    chatMessageInputElement.value = ""
}

function onChatMessage(data) {
    if (data.type === "chat_message") {

        let tmpInfo = document.querySelector('.tmp-info')

        if (tmpInfo) {
            tmpInfo.remove()
        }

        if (!data.agent) {
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
    } else if (data.type == 'writing_active') {
        if (!data.agent) {
            let tmpInfo = document.querySelector('.tmp-info')

            if (tmpInfo) {
                tmpInfo.remove()
            }

            chatLogElement.innerHTML += `
                <div class="tmp-info flex w-full mt-2 space-x-3 max-w-md">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>

                    <div>
                        <div class="bg-gray-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">The client is typing...</p>
                        </div>
                    </div>
                </div>
            `
        }
    }

    scrollToBottom()
}

chatSocket = new WebSocket(`ws://${window.location.host}/ws/${chatRoom}/`)

chatSocket.onmessage = function (e) {
    onChatMessage(JSON.parse(e.data))
}

chatSocket.onopen = function(e) {
    scrollToBottom()
}

chatSocket.onclose = function(e) {
    
}


chatMessageSubmitElement.onclick = function (e) {
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
    console.log("abc")
    chatSocket.send(JSON.stringify({
        'type': 'update',
        'message': 'writing_active',
        'name': document.querySelector("#user_name").textContent.replaceAll('"', ''),
        'agent': document.querySelector("#user_id").textContent.replaceAll('"', '')
    }))
}