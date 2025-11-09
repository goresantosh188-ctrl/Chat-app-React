import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { cookies } from "../global/config.js";
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { database } from "../../firebase-config.js";
import styles from "../styles/rooms.module.css";

function EnterRoom({ setAuth }) {
    const [room, setRoom] = useState(false);
    const [messages, setMessages] = useState([]);
    const [typers, setTypers] = useState([])
    console.log(room);

    const roomInputRef = useRef(null);
    const messageInputRef = useRef(null);

    const messagesRef = collection(database, "messages");
    const typingRef = collection(database, "typing-in-room");

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

    useEffect(() => {
        if (!room) return;

        const queryMessage = query(typingRef, where("room", "==", cookies.get("room-name") ? cookies.get("room-name") : room))

        const unsubscribe = onSnapshot(queryMessage, (snapshot) => {
            let activeTypers = []
            snapshot.forEach((doc) => {
                if (doc.data().typers) {
                    doc.data().typers.forEach(typer => {
                        if (!activeTypers.includes(typer)) activeTypers.push(typer);
                    })
                }
            })
            setTypers(activeTypers.filter((typer) => typer !== cookies.get("username")))
        })

        return () => unsubscribe();
    }, [room])

    const handleTyping = async () => {
        const username = cookies.get("username");
        const roomName = cookies.get("room-name") ? cookies.get("room-name") : room;
        
        const typingDoc = doc(database, "typing-in-room", `typing-doc-${roomName}`)
        const newTypers = typers?.includes(username)
                            ? typers
                            : [...(typers || []), username];

        await setDoc(typingDoc, { 
            room: roomName, 
            typers: newTypers 
        });
        setTypers(newTypers);
    };

    const createRoom = async () => {
        
        cookies.set("room-name", roomInputRef.current.value);
        setRoom(roomInputRef.current.value);
    }

        useEffect(() => {
            const handleKeyDown = async (event) => {
                if (event.key === "Enter") {
                    if (roomInputRef.current === document.activeElement) {
                        createRoom();
                    } 
                    else if (messageInputRef.current === document.activeElement) {
                        const typingDoc = doc(database, "typing-in-room", `typing-doc-${cookies.get("room-name") ? cookies.get("room-name") : room}`)
                        await updateDoc(typingDoc, {
                            typers: typers.filter(typer => typer !== cookies.get("username"))
                        }, { merge: true })
                        setTypers(typers.filter(typer => typer !== cookies.get("username")))
                        sendMessage();
                    }
                }
            };

            const handleBlur = async (event) => {
                const typingDoc = doc(database, "typing-in-room", `typing-doc-${cookies.get("room-name") ? cookies.get("room-name") : room}`)
                await updateDoc(typingDoc, {
                    typers: typers.filter(typer => typer !== cookies.get("username"))
                }, { merge: true })
                setTypers(typers.filter(typer => typer !== cookies.get("username")))
            }

            document.addEventListener("keydown", handleKeyDown);
            messageInputRef.current?.addEventListener("blur", handleBlur)
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
                messageInputRef.current?.removeEventListener("blur", handleBlur)
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
    const typingUsersInHTML = typers ? typers.map(typer => {
        return(Boolean(typers) ? <>{typer} is typing...</> : null);
    }) : <></>;
    console.log(typingUsersInHTML, typers)
    return(room 
           ? <> <div className={styles.roomContainer}>
                    <h1>{cookies.get("room-name")}</h1>
                    <div className={styles.messages}>
                        {messagesInHTML}
                    </div>
                    <div className="typing-container">
                        {typingUsersInHTML}
                    </div>
                    <input ref={messageInputRef} onChange={handleTyping} placeholder="Send...."></input>
                    <button onClick={sendMessage}>Send</button>
                    <br></br><br></br>
                    <button onClick={() => setRoom(false)}>Back</button>
                    <button onClick={() => {cookies.remove("auth-token"); setAuth(false);}}>Sign out</button>
                </div>
             </> 
           : <> <div className={styles.roomsContainer}>
                    <h1>Welcome back, {cookies.get("username")}!</h1>
                    <input ref={roomInputRef} placeholder="Enter room name..."></input>
                    <button onClick={() => createRoom()}>Enter</button>
                    <br></br><br></br>
                    <button onClick={() => {cookies.remove("auth-token"); setAuth(false);}}>Sign out</button>
                </div>
    </>);   
}

export default EnterRoom;