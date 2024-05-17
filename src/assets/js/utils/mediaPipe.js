import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";


function MediaPipe() {
    const rootElement = document.getElementById('root');

    // Create section element
    const section = document.createElement('section');
    section.id = 'demos';
    section.classList.add('invisible');

    // Create div element for video view
    const videoViewDiv = document.createElement('div');
    videoViewDiv.id = 'liveView';
    videoViewDiv.classList.add('videoView');

    // Create button element
    const button = document.createElement('button');
    button.id = 'webcamButton';
    button.classList.add('mdc-button', 'mdc-button--raised');
    button.innerHTML = `
      <span class="mdc-button__ripple"></span>
      <span class="mdc-button__label">START DETECTING </span>
  `;

    // Create div element for video and canvas
    const videoCanvasDiv = document.createElement('div');
    videoCanvasDiv.style.position = 'relative';

    // Create video element
    const video = document.createElement('video');
    video.id = 'webcam';
    video.style.position = 'absolute';
    video.style.left = '0';
    video.style.top = '0';
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.classList.add('output_canvas');
    canvas.id = 'output_canvas';
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';

    // Append elements to their respective parents
    videoCanvasDiv.appendChild(video);
    videoCanvasDiv.appendChild(canvas);
    videoViewDiv.appendChild(button);
    videoViewDiv.appendChild(videoCanvasDiv);
    section.appendChild(videoViewDiv);

    // Append the section to the root element
    rootElement.appendChild(section);
}

function startHandDetection(stream) {
    // DOM elements
    const video = document.getElementById("webcam");
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");
    const enableWebcamButton = document.getElementById("webcamButton");
    const demosSection = document.getElementById("demos");

    // HandLandmarker instance
    let handLandmarker = undefined;
    let runningMode = "IMAGE";
    let webcamRunning = false;
    let lastVideoTime = -1;
    let results = undefined;

    // Function to create HandLandmarker instance
    const createHandLandmarker = async () => {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: runningMode,
            numHands: 2 
        });
        demosSection.classList.remove("invisible");
    };

    // Function to enable webcam
    const enableWebcam = async () => {
        if (!handLandmarker) {
            console.log("Wait! HandLandmarker not loaded yet.");
            return;
        }

        if (webcamRunning) {
            webcamRunning = false;
            enableWebcamButton.innerText = "ENABLE PREDICTIONS";
        } else {
            webcamRunning = true;
            enableWebcamButton.innerText = "DISABLE PREDICTIONS";
        }
        console.log(stream);
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    };

    // Function to predict webcam frames
    const predictWebcam = async () => {
        canvasElement.style.width = video.videoWidth;
        canvasElement.style.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;

        if (runningMode === "IMAGE") {
            runningMode = "VIDEO";
            await handLandmarker.setOptions({ runningMode: "VIDEO" });
        }

        let startTimeMs = performance.now();
        if (lastVideoTime !== video.currentTime) {
            lastVideoTime = video.currentTime;
            results = await handLandmarker.detectForVideo(video, startTimeMs);
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        if (results.landmarks) {
            for (const landmarks of results.landmarks) {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 5
                });
                drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
            }
        }
        canvasCtx.restore();

        if (webcamRunning === true) {
            window.requestAnimationFrame(predictWebcam);
        }
    };

    // Initialize HandLandmarker
    createHandLandmarker();

    // Add event listener to enable webcam button
    enableWebcamButton.addEventListener("click", enableWebcam);
}

// // Usage example:
// // Provide the stream to the startHandDetection function
// MediaPipe()

// const stream = await navigator.mediaDevices.getUserMedia({ video: true });
// startHandDetection(stream);

export { MediaPipe, startHandDetection }