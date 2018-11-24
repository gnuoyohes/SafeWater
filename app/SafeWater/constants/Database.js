import * as firebase from 'firebase';

// Initialize Firebase
var config = {
  apiKey: "AIzaSyACTPwpcWHpmhxqNeMkmGgpqrfa7QbfaXw",
  authDomain: "safewater-24b0f.firebaseapp.com",
  databaseURL: "https://safewater-24b0f.firebaseio.com",
  projectId: "safewater-24b0f",
  storageBucket: "safewater-24b0f.appspot.com",
  messagingSenderId: "725957498350"
};
firebase.initializeApp(config);
var db = firebase.database();

export default {
  database: db,
};
