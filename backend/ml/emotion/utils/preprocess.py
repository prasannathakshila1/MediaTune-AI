"""
preprocess.py
=============
FER-2013 image preprocessing utilities.

FER-2013 folder structure (after download):
  ml/emotion/data/
    train/
      angry/      Training_XXXXXXX.jpg  ...
      disgust/
      fear/
      happy/
      neutral/
      sad/
      surprise/
    test/
      angry/      PrivateTest_XXXXXXX.jpg ...
      disgust/
      fear/
      happy/
      neutral/
      sad/
      surprise/

All images are 48x48 grayscale JPEGs.
"""

import os
import numpy as np
import cv2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# ── Constants ────────────────────────────────────────────────────
EMOTIONS    = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
NUM_CLASSES = 7
IMG_SIZE    = (48, 48)
IMG_SIZE_3C = (48, 48, 3)   # MobileNetV2 needs 3 channels

# FER-2013 class imbalance (approx counts in train set)
CLASS_COUNTS = {
    'angry':   3995,
    'disgust':  436,   # very small — needs oversampling
    'fear':    4097,
    'happy':   7215,
    'neutral': 4965,
    'sad':     4830,
    'surprise':3171,
}


def get_class_weights():
    """
    Compute class weights to handle FER-2013 imbalance.
    'disgust' has only ~436 samples vs 'happy' ~7215.
    """
    total  = sum(CLASS_COUNTS.values())
    n_cls  = len(CLASS_COUNTS)
    weights = {}
    for i, emotion in enumerate(EMOTIONS):
        weights[i] = total / (n_cls * CLASS_COUNTS[emotion])
    return weights


def build_generators(data_dir, batch_size=64):
    """
    Build train/val ImageDataGenerators from FER-2013 folder structure.
    Converts grayscale → RGB for MobileNetV2.
    """
    # Training: augmentation
    train_datagen = ImageDataGenerator(
        rescale=1. / 255,
        rotation_range=12,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.1,
        shear_range=0.1,
        fill_mode='nearest',
    )

    # Validation: only rescale
    val_datagen = ImageDataGenerator(rescale=1. / 255)

    train_gen = train_datagen.flow_from_directory(
        os.path.join(data_dir, 'train'),
        target_size=IMG_SIZE,
        color_mode='rgb',       # grayscale → 3-channel for MobileNetV2
        batch_size=batch_size,
        class_mode='categorical',
        classes=EMOTIONS,       # fix class order
        shuffle=True,
    )

    val_gen = val_datagen.flow_from_directory(
        os.path.join(data_dir, 'test'),
        target_size=IMG_SIZE,
        color_mode='rgb',
        batch_size=batch_size,
        class_mode='categorical',
        classes=EMOTIONS,
        shuffle=False,
    )

    return train_gen, val_gen


def preprocess_single_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess a raw image (bytes from HTTP upload) for inference.
    Returns shape: (1, 48, 48, 3)  float32 in [0, 1]
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        raise ValueError("Cannot decode image — ensure it is a valid JPEG/PNG")

    # Detect face region using Haar cascade (optional but improves accuracy)
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    faces = face_cascade.detectMultiScale(img, scaleFactor=1.1, minNeighbors=5, minSize=(20, 20))

    if len(faces) > 0:
        x, y, w, h = faces[0]
        img = img[y:y + h, x:x + w]  # crop to face

    img     = cv2.resize(img, IMG_SIZE)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)   # (48,48,3)
    img_f   = img_rgb.astype(np.float32) / 255.0
    return np.expand_dims(img_f, axis=0)              # (1,48,48,3)


def verify_dataset(data_dir):
    """Print dataset stats — call before training to confirm data is correct."""
    print("\n=== FER-2013 Dataset Verification ===")
    for split in ['train', 'test']:
        print(f"\n[{split}]")
        total = 0
        for emotion in EMOTIONS:
            path  = os.path.join(data_dir, split, emotion)
            count = len(os.listdir(path)) if os.path.exists(path) else 0
            total += count
            bar   = '█' * (count // 100)
            print(f"  {emotion:>10}: {count:5d}  {bar}")
        print(f"  {'TOTAL':>10}: {total:5d}")
    print()