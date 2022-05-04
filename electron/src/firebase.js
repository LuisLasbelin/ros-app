// Nombre fichero: firebase.js
// Fecha: WIP
// Autor: Jorge Grau Giannakakis
// Descripción: Aqui se especifican todos los datos necesaros para conectar con firebase

// firebase imports
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, doc } from 'firebase/firestore'
import * as firebaseAuth from 'firebase/auth'

// Configuración de firebase
var firebaseConfig = {
    apiKey: "AIzaSyDPjhcoNszTjWKoe_rubmmYZE--GX9tTL0",
    authDomain: "hamponator-web.firebaseapp.com",
    projectId: "hamponator-web",
    storageBucket: "hamponator-web.appspot.com",
    messagingSenderId: "910773774186",
    appId: "1:910773774186:web:f0031246f5e9ef1211e713"
};

// Inicializar app de Firebase
initializeApp(firebaseConfig);

// Inicializar y exportar instancia de Firestore
const db = getFirestore();
export { db, collection, query, where, getDocs, firebaseAuth };
