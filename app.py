from flask import Flask, request, jsonify
import cv2

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def upload_video():
    data = request.json
    video_url = data.get('videoUrl')
    style = data.get('style')
    
    # Process the video
    cartoon_video_url = convert_to_cartoon(video_url, style)
    
    return jsonify({'cartoonVideoUrl': cartoon_video_url})

def convert_to_cartoon(video_file, style):
    cap = cv2.VideoCapture(video_file)
    out = cv2.VideoWriter('cartoon_video.mp4', cv2.VideoWriter_fourcc(*'MP4V'), 20.0, (640,480))

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if style == "cartoon":
            cartoon_frame = cartoonify_frame(frame)
        elif style == "pencil":
            cartoon_frame = pencil_sketch(frame)
        elif style == "watercolor":
            cartoon_frame = watercolor_effect(frame)
        
        out.write(cartoon_frame)

    cap.release()
    out.release()
    return 'cartoon_video.mp4'

def cartoonify_frame(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return cv2.stylization(frame, sigma_s=60, sigma_r=0.6)

def pencil_sketch(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    inv = cv2.bitwise_not(gray)
    sketch = cv2.divide(gray, cv2.GaussianBlur(inv, (21, 21), 0), scale=256.0)
    return sketch

def watercolor_effect(frame):
    return cv2.stylization(frame, sigma_s=60, sigma_r=0.6)

if __name__ == '__main__':
    app.run(debug=True)
