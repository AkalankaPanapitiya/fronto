import React, { useCallback, useState ,useEffect} from "react";
import {useNavigate} from 'react-router-dom';
import{useSocket} from'../context/SocketProvider';


const LobbyScreen = () => {

  const [formInput, SetForminput] = useState({
    name: "",
    email: "",
    room : "",
  })

  const handleInputChange = (event) => {
    const { name, value } = event.target;
        SetForminput({...formInput, [name]: value })
  }

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    socket.emit("room:join", { name : formInput.name,email: formInput.email, room: formInput.room });
  }, [formInput.name, formInput.email, formInput.room, socket]);

  const handleJoiRoom = useCallback((data) => {
    const { name, email, room } = data
    navigate('/room/${room}');
    // console.log(name, email, room)
  },[navigate])
  
  useEffect(() => {
    socket.on("room:join", handleJoiRoom );
    return () => {
          socket.off("room:join", handleJoiRoom );
        };
  });  

  return (
    <div className="dark">
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">Lobby</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Name:
              <input 
              type="text" 
              name="name" 
              id="name"
              value={formInput.name}
              onChange={handleInputChange}
              
            
              />
            </label>
            
            <label>Email:
            <input 
              type="email" 
              name="email" 
              id="email"
              value={formInput.email}
              onChange={handleInputChange}
              
            
              />
            </label>
            
            <label>Room:
              <input 
              type="text" 
              name="room" 
              id="room"
              value={formInput.room}
              onChange={handleInputChange}
              
            
              />
            </label>
            <input type="submit" value="Submit" />
          </form>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
