import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { cookies } from "../global/config.js";
import { addDoc, collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { database } from "../../firebase-config.js";

function EnterRoom({ setAuth }) {
    const [room, setRoom] = useState(false);
    const [messages, setMessages] = useState([]);
    console.log(room);

    const roomInputRef = useRef(null);
    const messageInputRef = useRef(null);

    const messagesRef = collection(database, "messages");
    const roomsRef = collection(database, "rooms");

    const createRoom = async (roomName) => {

        useEffect(() => {
            const queryMessage = query(roomsRef, where("name", "===", roomName));
            onSnapshot(queryMessage, snapshot => {
                let messages = []
                snapshot.forEach(doc => {
                    messages.push({...doc.data(), id: doc.id})
                })
                setMessages(messages);
            })
        }, [])

        const queryMessage = query(roomsRef, where("name", "!==", roomName))
        const querySnapshot = await getDocs(queryMessage);

        if (querySnapshot.empty) {
            await addDoc(roomsRef, { name: roomInputRef.current.value});
        }

        cookies.set("room-name", roomInputRef.current.value);
        setRoom(roomInputRef.current.value);
    }

        useEffect(() => {
        const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            if (roomInputRef.current === document.activeElement) {
            createRoom(roomInputRef.current.value);
            } else if (messageInputRef.current === document.activeElement) {
            sendMessage();
            }
        }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
        document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const sendMessage = async () => {
        const message = {
            "sender": cookies.get("username"),
            "message": messageInputRef.current.value
        }
        if (messageInputRef.current.value === "") return;

        addDoc(messagesRef, message)
    }

    const messagesInHTML = messages ? messages.map(message => {
        return(Boolean(messages) ? <p>{message.sender}: {message.message}</p> : null);
    }) : "";
    return(room 
           ? <> 
                <h1>{cookies.get("room-name")}</h1>
                <div className="messages">
                    {messagesInHTML}
                </div>
                <input ref={messageInputRef} placeholder="Send...."></input>
                <button onClick={sendMessage}>Send</button>
                <br></br><br></br>
                <button onClick={() => setRoom(false)}>Back</button>
                <button onClick={() => {cookies.remove("auth-token"); setAuth(false);}}>Sign out</button>
             </> 
           : <> <div className="rooms-container">
                    <h1>Welcome back, {cookies.get("username")}!</h1>
                    <p>Room:</p>
                    <input ref={roomInputRef} placeholder="Enter room name..."></input>
                    <button onClick={() => createRoom(roomInputRef.current.value)}>Enter</button>
                    <br></br><br></br>
                    <button onClick={() => {cookies.remove("auth-token"); setAuth(false);}}>Sign out</button>
                </div>
    </>);   
}

export default EnterRoom;