"use client";
import { useEffect, useState } from "react";
import { Stack, Typography, TextField, Button } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import { io } from "socket.io-client";
import axios from 'axios';

const socket = io("ws://localhost:9002", {
  reconnectionDelayMax: 100000
});

export default function Home() {
  const [message, setMessage] = useState("");
  const [list, setList] = useState([]);
  const [file, setFile] = useState(null); // Para manejar el archivo seleccionado

  useEffect(() => {
    socket.on("newMessage", (data) => {
      console.log("Mensaje recibido:", data);
      setList((prevList) => [...prevList, data]);
    });

    socket.on("newImage", (data) => {
      console.log("Imagen recibida:", data);
      setList((prevList) => [...prevList, data]);
    });

    return () => {
      socket.off("newMessage");
      socket.off("newImage");
    };
  }, []);

  function handleSendMessage() {
    if (message.trim() !== "") {
      socket.emit("message", {
        id: socket.id,
        message: message,
        time: new Date()
      });
      setMessage("");
    }
  }

  function handleSendImage() {
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
  
      axios.post('http://localhost:9001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(response => {
        const imageUrl = response.data.imageUrl;
        console.log("Imagen subida y URL recibida:", imageUrl);
        socket.emit("image", {
          id: socket.id,
          image: imageUrl,
          time: new Date()
        });
        setFile(null); // Limpiar el archivo seleccionado
      }).catch(error => {
        console.error("Error al subir la imagen:", error);
      });
    }
  }
  

  return (
    <Stack sx={{ height: "100%" }}>
      <Stack
        sx={{
          height: "60px",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#EEE",
          flexShrink: 0
        }}
      >
        <Typography>Online Chat</Typography>
      </Stack>
      <Stack
        sx={{
          backgroundColor: "#F785D9",
          flexGrow: 1,
          width: "100%"
        }}
        p={3}
        spacing={2}
      >
        {list.map((item, index) => (
          <Stack
            key={index.toString()}
            sx={{
              maxWidth: "60%",
              backgroundColor: "white",
              borderRadius: "15px",
              minHeight: "30px",
              alignSelf: item.id === socket.id ? "flex-end" : "flex-start",
              p: 1,
              px: 2
            }}
          >
            {item.message && (
              <Typography>{item.message}</Typography>
            )}
            {item.image && (
              <img src={item.image} alt="Imagen" style={{ maxWidth: "100%", maxHeight: "200px" }} />
            )}
            <Typography>{new Date(item.time).toLocaleString()}</Typography>
          </Stack>
        ))}
      </Stack>
      <Stack
        sx={{
          height: "60px",
          alignItems: "center"
        }}
        direction="row"
        spacing={2}
      >
        <TextField
          label="Escribe tu mensaje"
          variant="standard"
          fullWidth
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <Button variant="contained" endIcon={<SendIcon />} onClick={handleSendMessage}
        sx={{ padding: '10px 10px', fontSize: '10px', minWidth: '30px', minHeight: '25px' }}>
          Enviar Mensaje
        </Button>
        
        <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files[0])}/>

        <Button variant="contained" endIcon={<SendIcon />} onClick={handleSendImage}
        sx={{ padding: '10px 10px', fontSize: '10px', minWidth: '30px', minHeight: '25px' }}
        >
          Enviar Imagen
        </Button>
      </Stack>
    </Stack>
  );
}
