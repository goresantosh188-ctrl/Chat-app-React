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

    useEffect(() => {
        console.log("In useEffect...");
        console.log("Checking if in a room...");
        console.log("Room", room);
        if (!room) return;

        console.log("Passed room meaning room is set.");
        console.log("Sending query message...")
        const queryMessage = query(messagesRef, where("room", "==", cookies.get("room-name")));

        console.log("Query message set.");
        console.log("Setting onSnapshot function...");
        const unsubscribe = onSnapshot(queryMessage, (snapshot) => {
            console.log("Inside onSnapshot function.");
        let messages = [];
        console.log("Attempting to cycle through documents...")
        snapshot.forEach((doc) => {
            console.log("Cycling through documents");
            console.log("Current document: ", doc);
            messages.push({ ...doc.data(), id: doc.id });
            console.log("New document added to array messages.");
        });
        console.log("Cycle is complete");
        setMessages(messages);
        });

        return () => unsubscribe();
    }, [room]);

    const createRoom = async () => {
        
        cookies.set("room-name", roomInputRef.current.value);
        setRoom(roomInputRef.current.value);
    }

        useEffect(() => {
        const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            if (roomInputRef.current === document.activeElement) {
            createRoom();
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
            "message": messageInputRef.current.value,
            "room": cookies.get("room-name")
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
                    <button onClick={() => createRoom()}>Enter</button>
                    <br></br><br></br>
                    <button onClick={() => {cookies.remove("auth-token"); setAuth(false);}}>Sign out</button>
                </div>
    </>);   
}

export default EnterRoom;