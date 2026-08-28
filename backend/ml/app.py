# backend/ml/app.py - FIXED with os import

import sys
import os  # ← Add this line
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify
from flask_cors import CORS

# ── Import blueprints ─────────────────────────────────────────────
from emotion.emotion_api import emotion_bp
from voice.voice_api     import voice_bp
from karaoke.karaoke_api import karaoke_bp

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:5000', 'http://localhost:8081'])

app.register_blueprint(emotion_bp)
app.register_blueprint(voice_bp)
app.register_blueprint(karaoke_bp)


@app.route('/health')
def health():
    return jsonify({
        'service': 'MoodTune ML Service',
        'status':  'ok',
        'endpoints': [
            'POST /predict-emotion',
            'GET  /emotion-labels',
            'POST /analyze-voice',
            'GET  /vocal-range',
            'POST /karaoke/separate',
            'POST /karaoke/transcribe',
            'GET  /karaoke/status',
        ]
    })


if __name__ == '__main__':
    port = int(os.environ.get('ML_PORT', 5001))
    print(f"\n🎵 MoodTune ML Service starting on port {port}")
    print(f"   Emotion model: {'FOUND' if os.path.exists('emotion/models/emotion_model.tflite') else 'NOT FOUND — run train_emotion.py first'}")
    app.run(host='0.0.0.0', port=port, debug=True)  # Set debug=True for development