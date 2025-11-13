import Auth from "./components/auth.jsx";
import EnterRoom from "./components/rooms.jsx";
import { cookies } from "./global/config.js";
import React, { useState, useEffect } from "react";

function App() {
  const [isAuth, setIsAuth] = useState(cookies.get("auth-token"));
  const username = cookies.get("username");
  console.log(username);

  useEffect(() => {
    document.title = "Chat App"
  }, [])

  if (!isAuth) {
    return(<> 
      <Auth setIsAuth={setIsAuth}/> 
    </>);
  }
  return(<>
    <EnterRoom setAuth={setIsAuth}/>
  </>);
}

export default App
