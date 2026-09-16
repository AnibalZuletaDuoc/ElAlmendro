import { io, Socket } from 'socket.io-client';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let socketChatActual: Socket | null = null;

/**
 * Un solo socket de chat por pestana, que sobrevive a la navegacion entre
 * paginas: cada pantalla monta su propio Marco, y si el socket viviera en el
 * componente se reconectaria (y parpadearia la presencia) en cada cambio de
 * ruta. Viaja con la misma cookie httpOnly que las peticiones HTTP.
 */
export function socketChat(): Socket {
  if (!socketChatActual) {
    socketChatActual = io(`${BASE}/chat`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socketChatActual;
}

/** Al cerrar sesion: asi el servidor marca al usuario como desconectado. */
export function cerrarSocketChat() {
  socketChatActual?.disconnect();
  socketChatActual = null;
}
