import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { auth, provider } from "../../firebase-config.js";
import { cookies } from "../global/config.js"
import PropTypes from "prop-types";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/auth.module.css";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { database } from "../../firebase-config.js";

function Auth({ setIsAuth }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [SMScode, setSMScode] = useState(0);
    const [page, setPage] = useState("signup");

    const accountsRef = collection(database, "accounts");

    const recaptchaVerifierRef = useRef(null);
    const recaptchaWidgetIdRef = useRef(null);
    const confirmationResultRef = useRef(null);

    useEffect(() => {
        if (page === "phone-login-pre-sms" && !cookies.get("recaptcha-verifier")) {
            const recaptchaVerifier = new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {
                size: "normal",
                callback: (response) => {
                    console.log("reCAPTCHA verified", response);
                },
                },
        );
        
        recaptchaVerifierRef.current = recaptchaVerifier;

        recaptchaVerifierRef.current.render().then((widgetId) => {
            recaptchaWidgetIdRef.current = widgetId;
        });

        }
    }, [page]);

    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, provider);
        const authToken = result.user.refreshToken;
        const username = result.user.displayName;
        console.log(username)
        setIsAuth(true);
        cookies.set("username", username);
        cookies.set("auth-token", authToken);
        
    }

    const loginWithPhoneNumber = async (event) => {
        event.preventDefault();

        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
        window.alert("An SMS has been sent to your phone number. Please enter it in the box below")
        setPage("phone-login-post-sms");
        
        confirmationResultRef.current = confirmationResult;
    }

    const ConfirmCodeToLoginWithPhoneNumber = async (event) => {
        event.preventDefault();

        const result = await confirmationResultRef.current.confirm(SMScode);

        const authToken = result.user.refreshToken;   
        const username = result.user.displayName;

        cookies.set("username", username);
        cookies.set("auth-token", authToken);

        setIsAuth(true);
    }

    const signUp = async (event) => {
        event.preventDefault();

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
            window.alert(`The email ${email} is already taken. Please choose another one or log into said account.`);
            return;
        }

        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            await addDoc(accountsRef, {
                "username": username,
                "email": userCredentials.user.email
            });
            setIsAuth(true);
            window.alert(`User registered \n Username: ${username} \n Email: ${email} \n Password: ${password}`);
            cookies.set("auth-token", userCredentials.user.refreshToken);
            cookies.set("username", username);
            cookies.set("email", userCredentials.user.email);
            cookies.set("password", password)
        }
        catch (error) {
            if (error.code === "auth/missing-email") {
                window.alert("Email is Missing");
                return;
            }
            else if (error.code === "auth/invalid-email") {
                window.alert("Invalid email");
                return;
            }
            else if (error.code === "auth/email-already-in-use") {
                window.alert(`The email ${email} is already taken. Please choose another one or log into said account.`);
                return;
            }
            else {
                console.error(error);
                return;
            }
        }    
    }

    const signIn = async (event) => {
        event.preventDefault();

        const usernameQueryMessage = query(accountsRef, where("username", "==", username));
        const usernameSnapshot = await getDocs(usernameQueryMessage);
        
        if (!usernameSnapshot.empty) {
            try {
                const userCredentials = await signInWithEmailAndPassword(auth, email, password);
                setIsAuth(true);
                window.alert(`User logged in \n Username: ${username} \n Email: ${email} \n Password: ${password}`);
                cookies.set("auth-token", userCredentials.user.refreshToken);
                cookies.set("username", username);
                cookies.set("email", userCredentials.user.email);
                cookies.set("password", password);
            } catch (error) {
                if (error.code === "auth/invalid-credential") {
                    window.alert("Invalid credentials");
                }
            }
        }
        else {
            window.alert(`Cannot find an account with username ${username}`)
        }
    }

    const resetPassword = async (event) => {
        event.preventDefault();

        try {
            await sendPasswordResetEmail(auth, email);
            window.alert("Password reset email has been sent. Please check both your main and spam inbox.");
        } catch (error) {
            if (error.code === "auth/missing-email") {
                window.alert("Please enter an email");
            }
            else if (error.code === "auth/invalid-email") {
                window.alert("Invalid email.");
            }
        }
    }
    return(page === "signup" ? <>
        <div className="auth-container">
            <p>Create a new account to continue</p>   
            <button onClick={loginWithGoogle}>Sign in with google</button> 
            <button onClick={() => setPage("phone-login-pre-sms")}>Sign in with phone</button>
            <form className={styles.signUpForm} onSubmit={signUp}>
                <input value={email} onChange={(event) => setEmail(event.target.value)}type="email" placeholder="Email"></input>
                <input value={username} onChange={(event) => setUsername(event.target.value)}type="username" placeholder="Username"></input>
                <input value={password} onChange={(event) => setPassword(event.target.value)}type="password" placeholder="Password"></input>
                <button type="submit">Sign Up</button>
            </form>
            <p>Already have an account?</p>
            <button onClick={() => setPage("login")}>Go to Log in</button>
        </div>
    </> : page === "login" ? <>
        <div className="auth-container">
            <p>Sign in</p>
            <button onClick={loginWithGoogle}>Sign in with google</button> 
            <button onClick={() => setPage("phone-login-pre-sms")}>Sign in with phone</button>
            <form className={styles.signInForm} onSubmit={signIn}>
                <input value={email} onChange={(event) => setEmail(event.target.value)}type="email" placeholder="Email"></input>
                <input value={username} onChange={(event) => setUsername(event.target.value)}type="username" placeholder="Username"></input>
                <input value={password} onChange={(event) => setPassword(event.target.value)}type="password" placeholder="Password"></input>
                <button type="submit">Sign in</button>
            </form>
            <p>Dont have an account?</p>
            <button onClick={() => setPage("signup")}>Go to Sign Up</button>
            <button onClick={() => setPage("forgot-password")}>Forgot password?</button>
        </div>
    </> : page == "forgot-password" ? <>
        <div className="auth-container">
            <p>Reset password</p>
            <form className={styles.forgotPasswordForm} onSubmit={resetPassword}>
                <input value={email} onChange={(event) => setEmail(event.target.value)}type="email" placeholder="Email"></input>
                <button type="submit">Reset password</button>
            </form>
            <button onClick={() => setPage("signup")}>Back</button>
        </div>
    </> : page === "phone-login-pre-sms" ? <>
        <div className="auth-container">
            <form className={styles.phoneSignInFormPreSMS} onSubmit={loginWithPhoneNumber}>
                <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Phone number"></input>
                <button type="submit">Enter</button>
            </form>
            <div id="recaptcha-container"></div>
            <button onClick={() => setPage("signup")}>Back</button>
        </div>
    </> : page === "phone-login-post-sms" ? <>
        <h2>Please enter the code sent to you via SMS</h2>
        <form className={styles.phoneSignInFormPostSMS} onSubmit={ConfirmCodeToLoginWithPhoneNumber}>
            <input value={SMScode} onChange={(event) => setSMScode(event.target.value)} placeholder="ENTER SMS..."></input>
            <button type="submit">Submit</button>
        </form>
    </> : 
    <>Error 404: Could not find page</>)
}

Auth.propTypes = {
    setIsAuth: PropTypes.func
}

export default Auth;