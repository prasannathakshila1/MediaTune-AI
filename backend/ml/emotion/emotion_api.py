"""
emotion_api.py
==============
Flask Blueprint — serves emotion predictions using the trained TFLite model.

Endpoint:  POST /predict-emotion
Input:     multipart/form-data  field: image (JPEG / PNG)
Output:    { emotion, confidence, all_scores }
"""

import os
import numpy as np
from flask import Blueprint, request, jsonify
from emotion.utils.preprocess import preprocess_single_image, EMOTIONS

emotion_bp = Blueprint('emotion', __name__)

# ── Lazy-load TFLite interpreter ─────────────────────────────────
_interpreter    = None
_input_details  = None
_output_details = None

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'emotion_model.tflite')


def get_interpreter():
    global _interpreter, _input_details, _output_details
    if _interpreter is None:
        import tensorflow as tf
        print(f"Loading TFLite model from: {MODEL_PATH}")
        _interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
        _interpreter.allocate_tensors()
        _input_details  = _interpreter.get_input_details()
        _output_details = _interpreter.get_output_details()
        print("TFLite model loaded OK")
    return _interpreter, _input_details, _output_details


@emotion_bp.route('/predict-emotion', methods=['POST'])
def predict_emotion():
    """
    POST /predict-emotion
    ─────────────────────
    Body : multipart/form-data
      image  (required) — face photo JPEG/PNG

    Returns
    -------
    {
      "emotion":    "happy",
      "confidence": 0.9231,
      "all_scores": {
        "angry": 0.01, "disgust": 0.00, "fear": 0.02,
        "happy": 0.92, "neutral": 0.03, "sad": 0.01, "surprise": 0.01
      }
    }
    """
    if 'image' not in request.files:
        return jsonify({'error': 'image field is required'}), 400

    try:
        image_bytes = request.files['image'].read()
        if not image_bytes:
            return jsonify({'error': 'empty image'}), 400

        # Preprocess → (1, 48, 48, 3) float32
        img_tensor = preprocess_single_image(image_bytes)

        # Run inference
        interpreter, input_details, output_details = get_interpreter()
        interpreter.set_tensor(input_details[0]['index'], img_tensor)
        interpreter.invoke()
        predictions = interpreter.get_tensor(output_details[0]['index'])[0]  # shape (7,)

        idx        = int(np.argmax(predictions))
        emotion    = EMOTIONS[idx]
        confidence = float(predictions[idx])
        all_scores = {e: round(float(predictions[i]), 4) for i, e in enumerate(EMOTIONS)}

        return jsonify({
            'emotion':    emotion,
            'confidence': round(confidence, 4),
            'all_scores': all_scores,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@emotion_bp.route('/emotion-labels', methods=['GET'])
def get_labels():
    """Returns the 7 emotion class labels."""
    return jsonify({'emotions': EMOTIONS})