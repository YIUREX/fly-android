
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Configuración de Firebase proporcionada
const firebaseConfig = {
  apiKey: "AIzaSyAYt2vsawtudmCQZRy0_SkMVwCxEoLa4Lk",
  authDomain: "fly--game.firebaseapp.com",
  projectId: "fly--game",
  storageBucket: "fly--game.firebasestorage.app",
  messagingSenderId: "446063066272",
  appId: "1:446063066272:web:9bd0eedc5a2976db501dc5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Servicios
const db = getFirestore(app);
const auth = getAuth(app);

// Lógica de Autenticación Anónima Automática
// Esto genera un UID único para cada jugador sin pedir datos, 
// necesario para reglas de seguridad de Firestore más adelante.
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✈️ Enlace de datos tácticos establecido. UID:", user.uid);
  } else {
    signInAnonymously(auth)
      .then(() => {
        console.log("✈️ Conexión anónima inicializada correctamente.");
      })
      .catch((error) => {
        console.error("❌ Error en el enlace de datos (Auth):", error.code, error.message);
      });
  }
});

export { db, auth };
