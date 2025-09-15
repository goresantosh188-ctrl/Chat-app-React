import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, provider } from "../../../firebase-config.js";
import { cookies } from "../../global/config.js"
import PropTypes from "prop-types";
import axios from "axios";
import React, { useState } from "react";
import styles from "../styles/auth.module.css";
import { collection, getDocs, query, where } from "firebase/firestore";
import { database } from "../../firebase-config.js";

function Auth({ setIsAuth }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isOnSignUpPage, setIsOnSignUpPage] = useState(true);

    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, provider);
        const authToken = result.user.refreshToken;
        const username = result.user.displayName;
        console.log(username)
        setIsAuth(true);
        cookies.set("username", username);
        cookies.set("auth-token", authToken);
        
    }

    const signUp = async (event) => {
        event.preventDefault();

        const accountsRef = collection(database, "accounts");

        if (!username) {
            window.alert("Please enter a username");
            return;
        }
        if (!password) {
            window.alert("Please enter a password");
            return;
        }
        if (username.length < 3 || username.length > 16) {
            window.alert("Please enter a username in between 3 and 16 characters");
            return;
        }
        if (password.length < 8) {
            window.alert("The password must be greater then 8 characters");
            return;
        }
        
        const usernameQueryMessage = query(accountsRef, where("username", "==", username));
        const usernameSnapshot = await getDocs(usernameQueryMessage);

        const emailQueryMessage = query(accountsRef, where("email", "==", email));
        const emailSnapshot = await getDocs(emailQueryMessage);

        if (!usernameSnapshot.empty) {
            window.alert(`There is already an account with the username ${username}`);
            return;
        }
        if (!emailSnapshot.empty) {
            window.alert(`The email ${accounts.email} is already taken. Please choose another one or log into said account.`);
            return;
        }

        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            await addDoc(accountsRef, {
                "username": cookies.get("username"),
                "email": userCredentials.user.email,
                "password": userCredentials.user.password
            });
            setIsAuth(true);
            window.alert(`User registered \n Username: ${username} \n Email: ${email} \n Password: ${password}`);
            cookies.set("auth-token", userCredentials.user.refreshToken);
            cookies.set("email", userCredentials.user.email);
            cookies.set("password", userCredentials.user.password)
        }
        catch (error) {
            if (error.code === "auth/missing-email") {
                window.alert("Email is Missing");
                return;
            }
            else if (error.code === "auth/email-already-in-use") {
                window.alert(`The email ${accounts.email} is already taken. Please choose another one or log into said account.`);
                return;
            }
            else {
                console.error(error);
                return;
            }
        }    
    }
    return(isOnSignUpPage ? <>
        <div className="auth-container">
            <p>Create a new account to continue</p>   
            <button onClick={loginWithGoogle}>Sign in with google</button> 
            <form className="sign-up-form" onSubmit={signUp}>
                <input value={email} onChange={(event) => setEmail(event.target.value)}type="email" placeholder="Email"></input>
                <input value={username} onChange={(event) => setUsername(event.target.value)}type="username" placeholder="Username"></input>
                <input value={password} onChange={(event) => setPassword(event.target.value)}type="password" placeholder="Password"></input>
                <button type="submit">Sign Up</button>
            </form>
            <p>Already have an account?</p>
            <button onClick={setIsOnSignUpPage(true)}>Log in</button>
        </div>
    </> : <>Log in</>)
}

Auth.propTypes = {
    setIsAuth: PropTypes.func
}

export default Auth;