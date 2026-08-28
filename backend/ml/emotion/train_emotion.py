"""
train_emotion.py
=================
Trains a MobileNetV2 model on FER-2013 dataset.

STEP 1: Download dataset
  bash download_dataset.sh
  (or manually unzip to ml/emotion/data/train/ and ml/emotion/data/test/)

STEP 2: Install dependencies
  pip install tensorflow keras numpy matplotlib scikit-learn opencv-python

STEP 3: Run training
  python train_emotion.py

OUTPUTS (saved to ml/emotion/models/):
  emotion_model.h5        ← Full Keras model
  emotion_model.tflite    ← TFLite quantized (used by Flask API)
  training_curves.png     ← Accuracy / loss plots
  class_report.txt        ← Per-emotion precision/recall/F1
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
)
from utils.preprocess import (
    build_generators, get_class_weights, verify_dataset, EMOTIONS, NUM_CLASSES
)

# ── Config ────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(__file__)
DATA_DIR   = os.path.join(BASE_DIR, 'data')
MODEL_DIR  = os.path.join(BASE_DIR, 'models')
BATCH_SIZE = 64
EPOCHS_P1  = 20    # Phase 1: train head only (frozen base)
EPOCHS_P2  = 30    # Phase 2: fine-tune top layers

os.makedirs(MODEL_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────
# 1. VERIFY DATASET
# ─────────────────────────────────────────────────────────────────
verify_dataset(DATA_DIR)

# ─────────────────────────────────────────────────────────────────
# 2. DATA GENERATORS
#    FER-2013: train/ → 28,709 images | test/ → 7,178 images
#    Grayscale 48x48 → converted to RGB for MobileNetV2
# ─────────────────────────────────────────────────────────────────
train_gen, val_gen = build_generators(DATA_DIR, BATCH_SIZE)
class_weights      = get_class_weights()

print(f"Train batches : {len(train_gen)}")
print(f"Val   batches : {len(val_gen)}")
print(f"Class weights : {class_weights}")

# ─────────────────────────────────────────────────────────────────
# 3. BUILD MODEL
#    Base : MobileNetV2 (imagenet weights, no top)
#    Head : GAP → Dense(256) → Dropout → Dense(128) → Dense(7, softmax)
# ─────────────────────────────────────────────────────────────────
def build_model(num_classes=NUM_CLASSES):
    base = MobileNetV2(
        input_shape=(48, 48, 3),
        include_top=False,
        weights='imagenet',
    )
    base.trainable = False          # frozen for Phase 1

    inputs = tf.keras.Input(shape=(48, 48, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.Dropout(0.45)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.30)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)

    return Model(inputs, outputs), base


model, base_model = build_model()
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy'],
)
model.summary()

# ─────────────────────────────────────────────────────────────────
# 4. PHASE 1 — Train head only (base frozen)
# ─────────────────────────────────────────────────────────────────
print("\n" + "="*50)
print("PHASE 1: Training classification head (base frozen)")
print("="*50)

callbacks_p1 = [
    EarlyStopping(monitor='val_accuracy', patience=6, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-7, verbose=1),
    ModelCheckpoint(
        os.path.join(MODEL_DIR, 'best_p1.h5'),
        monitor='val_accuracy', save_best_only=True, verbose=1
    ),
]

history_p1 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_P1,
    callbacks=callbacks_p1,
    class_weight=class_weights,   # handle 'disgust' imbalance
    verbose=1,
)

print(f"\nPhase 1 best val_accuracy: {max(history_p1.history['val_accuracy']):.4f}")

# ─────────────────────────────────────────────────────────────────
# 5. PHASE 2 — Fine-tune top 30 layers of MobileNetV2
# ─────────────────────────────────────────────────────────────────
print("\n" + "="*50)
print("PHASE 2: Fine-tuning MobileNetV2 top layers")
print("="*50)

base_model.trainable = True

# Freeze all layers except the last 30
for layer in base_model.layers[:-30]:
    layer.trainable = False

# Recompile with low LR for fine-tuning
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy'],
)

callbacks_p2 = [
    EarlyStopping(monitor='val_accuracy', patience=8, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=4, min_lr=1e-8, verbose=1),
    ModelCheckpoint(
        os.path.join(MODEL_DIR, 'best_p2.h5'),
        monitor='val_accuracy', save_best_only=True, verbose=1
    ),
]

history_p2 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_P2,
    callbacks=callbacks_p2,
    class_weight=class_weights,
    verbose=1,
)

print(f"\nPhase 2 best val_accuracy: {max(history_p2.history['val_accuracy']):.4f}")

# ─────────────────────────────────────────────────────────────────
# 6. SAVE FULL MODEL
# ─────────────────────────────────────────────────────────────────
full_model_path = os.path.join(MODEL_DIR, 'emotion_model.h5')
model.save(full_model_path)
print(f"\n✅ Saved: {full_model_path}")

# ─────────────────────────────────────────────────────────────────
# 7. CONVERT TO TFLITE (quantized for fast Flask inference)
# ─────────────────────────────────────────────────────────────────
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]   # int8 quantization

# Representative dataset for full-integer quantization
def representative_data():
    val_gen.reset()
    for i, (imgs, _) in enumerate(val_gen):
        if i >= 100: break
        for img in imgs:
            yield [img[np.newaxis, ...].astype(np.float32)]

converter.representative_dataset = representative_data

tflite_model = converter.convert()
tflite_path  = os.path.join(MODEL_DIR, 'emotion_model.tflite')
with open(tflite_path, 'wb') as f:
    f.write(tflite_model)
print(f"✅ Saved: {tflite_path}  ({len(tflite_model)//1024} KB)")

# ─────────────────────────────────────────────────────────────────
# 8. EVALUATION — Per-emotion classification report
# ─────────────────────────────────────────────────────────────────
print("\n=== Per-emotion Evaluation ===")
val_gen.reset()
y_pred = model.predict(val_gen, verbose=1)
y_pred_classes = np.argmax(y_pred, axis=1)
y_true         = val_gen.classes

report = classification_report(y_true, y_pred_classes, target_names=EMOTIONS)
print(report)

report_path = os.path.join(MODEL_DIR, 'class_report.txt')
with open(report_path, 'w') as f:
    f.write(report)
print(f"✅ Saved: {report_path}")

# ─────────────────────────────────────────────────────────────────
# 9. CONFUSION MATRIX
# ─────────────────────────────────────────────────────────────────
cm = confusion_matrix(y_true, y_pred_classes)
plt.figure(figsize=(9, 7))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=EMOTIONS, yticklabels=EMOTIONS)
plt.title('FER-2013 Confusion Matrix')
plt.ylabel('True label')
plt.xlabel('Predicted label')
plt.tight_layout()
cm_path = os.path.join(MODEL_DIR, 'confusion_matrix.png')
plt.savefig(cm_path, dpi=150)
print(f"✅ Saved: {cm_path}")

# ─────────────────────────────────────────────────────────────────
# 10. TRAINING CURVES
# ─────────────────────────────────────────────────────────────────
all_acc     = history_p1.history['accuracy']     + history_p2.history['accuracy']
all_val_acc = history_p1.history['val_accuracy'] + history_p2.history['val_accuracy']
all_loss    = history_p1.history['loss']         + history_p2.history['loss']
all_val_loss= history_p1.history['val_loss']     + history_p2.history['val_loss']

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
ax1.plot(all_acc,     label='Train Acc',  color='#4CAF50')
ax1.plot(all_val_acc, label='Val Acc',    color='#2196F3')
ax1.axvline(len(history_p1.history['accuracy']), color='orange', linestyle='--', label='Fine-tune start')
ax1.set_title('Accuracy')
ax1.set_xlabel('Epoch')
ax1.legend()

ax2.plot(all_loss,     label='Train Loss', color='#F44336')
ax2.plot(all_val_loss, label='Val Loss',   color='#FF9800')
ax2.axvline(len(history_p1.history['loss']), color='orange', linestyle='--', label='Fine-tune start')
ax2.set_title('Loss')
ax2.set_xlabel('Epoch')
ax2.legend()

plt.suptitle('MoodTune — Emotion Model Training (FER-2013)', fontsize=14)
plt.tight_layout()
curve_path = os.path.join(MODEL_DIR, 'training_curves.png')
plt.savefig(curve_path, dpi=150)
print(f"✅ Saved: {curve_path}")

print("\n" + "="*50)
print("TRAINING COMPLETE")
print(f"  Model:   {full_model_path}")
print(f"  TFLite:  {tflite_path}")
print(f"  Report:  {report_path}")
print("="*50)