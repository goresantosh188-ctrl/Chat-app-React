import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { cookies } from "../global/config.js";
import { addDoc, collection, getDocs, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { database } from "../../firebase-config.js";
import styles from "../styles/rooms.module.css";

function EnterRoom({ setAuth }) {
    const [room, setRoom] = useState(false);
    const [messages, setMessages] = useState([]);
    console.log(room);

    const roomInputRef = useRef(null);
    const messageInputRef = useRef(null);

    const messagesRef = collection(database, "messages");

    useEffect(() => {
        if (!room) return;

        const queryMessage = query(messagesRef, where("room", "==", cookies.get("room-name")), orderBy("timestamp"));

        const unsubscribe = onSnapshot(queryMessage, (snapshot) => {
        let messages = [];
        snapshot.forEach((doc) => {
            messages.push({ ...doc.data(), id: doc.id });
        });
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
            "room": cookies.get("room-name"),
            "timestamp": serverTimestamp()
        }
        if (messageInputRef.current.value === "") return;

        addDoc(messagesRef, message)
        messageInputRef.current.value = "";
    }

    const messagesInHTML = messages ? messages.map(message => {
        return(Boolean(messages) ? <p>{message.sender}: {message.message}</p> : null);
    }) : "";
    return(room 
           ? <> <div className={styles.roomContainer}>
                <h1>{cookies.get("room-name")}</h1>
                <div className={styles.messages}>
                    {messagesInHTML}
                </div>
                <input ref={messageInputRef} placeholder="Send...."></input>
                <button onClick={sendMessage}>Send</button>
                <br></br><br></br>
                <button onClick={() => setRoom(false)}>Back</button>
                <button onClick={() => {cookies.remove("auth-token"); setAuth(false);}}>Sign out</button>
                </div>
             </> 
           : <> <div className="rooms-container">
                    <h1>Welcome back, {cookies.get("username")}!</h1>
                    <input ref={roomInputRef} placeholder="Enter room name..."></input>
                    <button onClick={() => createRoom()}>Enter</button>
                    <br></br><br></br>
                    <button onClick={() => {cookies.remove("auth-token"); setAuth(false);}}>Sign out</button>
                </div>
    </>);   
}

export default EnterRoom;