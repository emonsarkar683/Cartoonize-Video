import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase Configuration

const firebaseConfig = {
    apiKey: "AIzaSyAkm1PN9yLM-2nIWN_508oYFHdeqAergLw",
  authDomain: "ensark-cartoonize.firebaseapp.com",
  projectId: "ensark-cartoonize",
  storageBucket: "ensark-cartoonize.appspot.com",
  messagingSenderId: "774713945238",
  appId: "1:774713945238:web:52b8881281b3cec47766b7",
  measurementId: "G-71B6LVB5PN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Function to upload video and convert
function uploadVideo() {
    const videoFile = document.getElementById('videoFile').files[0];
    const selectedStyle = document.getElementById('styleSelect').value;
    
    if (!videoFile) {
        alert("Please upload a video first.");
        return;
    }

    const storageRef = firebase.storage().ref('videos/' + videoFile.name);
    const uploadTask = storageRef.put(videoFile);

    uploadTask.on('state_changed', 
        function(snapshot) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            document.getElementById('progress-bar').value = progress;
            document.getElementById('progress-text').innerText = `Upload Progress: ${Math.floor(progress)}%`;
        }, 
        function(error) {
            alert('Upload failed: ' + error.message);
        }, 
        function() {
            uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
                fetch('/upload', {
                    method: 'POST',
                    body: JSON.stringify({ videoUrl: downloadURL, style: selectedStyle }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    const user = firebase.auth().currentUser;

                    // Save to Firestore
                    db.collection('videos').add({
                        userId: user.uid,
                        originalVideoUrl: downloadURL,
                        cartoonVideoUrl: data.cartoonVideoUrl,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // Display the converted video
                    document.getElementById('cartoon-video').src = data.cartoonVideoUrl;
                });
            });
        }
    );
}

// Load User History
function loadUserHistory() {
    const user = firebase.auth().currentUser;
    db.collection('videos').where('userId', '==', user.uid)
        .get()
        .then(querySnapshot => {
            const historyContainer = document.getElementById('history-container');
            historyContainer.innerHTML = ''; // Clear previous content

            querySnapshot.forEach(doc => {
                const videoData = doc.data();
                const videoElement = document.createElement('div');
                videoElement.innerHTML = `
                    <h4>Original Video:</h4>
                    <video controls src="${videoData.originalVideoUrl}" width="100%"></video>
                    <h4>Cartoon Video:</h4>
                    <video controls src="${videoData.cartoonVideoUrl}" width="100%"></video>
                    <hr>
                `;
                historyContainer.appendChild(videoElement);
            });
        });
}
