"""
karaoke_api.py
==============
Flask Blueprint — stem separation + ASR lyrics.

Libraries:
  audio-separator  → vocal / instrumental stem separation (MDX-Net models)
  spleeter         → fallback if audio-separator unavailable
  openai-whisper   → ASR: audio → timestamped lyrics (LRC format)

Endpoints:
  POST /karaoke/separate     → split audio into vocal + instrumental
  POST /karaoke/transcribe   → generate timestamped lyrics from audio
  GET  /karaoke/status       → check which libraries are available
"""

import os
import tempfile
import json
from flask import Blueprint, request, jsonify, send_file

karaoke_bp = Blueprint('karaoke', __name__)

CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)


# ── Library availability check ────────────────────────────────────
def check_libs():
    status = {}
    try:
        from audio_separator.separator import Separator
        status['audio_separator'] = True
    except ImportError:
        status['audio_separator'] = False
    try:
        import spleeter
        status['spleeter'] = True
    except ImportError:
        status['spleeter'] = False
    try:
        import whisper
        status['whisper'] = True
    except ImportError:
        status['whisper'] = False
    return status


# ── Stem separation ───────────────────────────────────────────────
def separate_with_audio_separator(audio_path: str, output_dir: str) -> dict:
    """
    Use audio-separator (MDX-Net / Demucs models).
    Best quality — recommended.
    pip install audio-separator
    """
    from audio_separator.separator import Separator

    sep = Separator(
        output_dir=output_dir,
        output_format='wav',
        normalization_threshold=0.9,
    )
    # UVR_MDXNET_Main gives best vocal isolation
    sep.load_model('UVR_MDXNET_Main.onnx')
    output_files = sep.separate(audio_path)

    result = {}
    for f in output_files:
        lf = f.lower()
        if 'vocals' in lf or 'vocal' in lf:
            result['vocals'] = f
        elif 'instrumental' in lf or 'accompaniment' in lf or 'no_vocals' in lf:
            result['instrumental'] = f
    return result


def separate_with_spleeter(audio_path: str, output_dir: str) -> dict:
    """
    Fallback: Spleeter 2-stems (faster, slightly lower quality).
    pip install spleeter
    """
    import subprocess
    subprocess.run(
        ['spleeter', 'separate', '-p', 'spleeter:2stems', '-o', output_dir, audio_path],
        check=True
    )
    base = os.path.splitext(os.path.basename(audio_path))[0]
    stem_dir = os.path.join(output_dir, base)
    return {
        'vocals':       os.path.join(stem_dir, 'vocals.wav'),
        'instrumental': os.path.join(stem_dir, 'accompaniment.wav'),
    }


def separate_stems(audio_path: str, output_dir: str) -> dict:
    """Try audio-separator first, fall back to spleeter."""
    try:
        return separate_with_audio_separator(audio_path, output_dir)
    except (ImportError, Exception):
        return separate_with_spleeter(audio_path, output_dir)


# ── ASR Lyrics via Whisper ────────────────────────────────────────
def transcribe_to_lrc(audio_path: str) -> dict:
    """
    Use OpenAI Whisper to transcribe audio → timestamped lyrics.
    Returns:
      segments : [ { start, end, text } ]
      lrc      : LRC-format string  "[mm:ss.xx] lyric line"
    """
    import whisper

    # 'base' balances speed vs accuracy; use 'medium' for better results
    model  = whisper.load_model('base')
    result = model.transcribe(
        audio_path,
        word_timestamps=False,   # segment-level timestamps
        language=None,           # auto-detect language
    )

    segments = []
    lrc_lines = []

    for seg in result.get('segments', []):
        start_s = seg['start']
        end_s   = seg['end']
        text    = seg['text'].strip()

        segments.append({
            'start': round(start_s, 2),
            'end':   round(end_s, 2),
            'text':  text,
        })

        # Convert to LRC timestamp: [mm:ss.xx]
        mm  = int(start_s // 60)
        ss  = start_s % 60
        lrc_lines.append(f'[{mm:02d}:{ss:05.2f}]{text}')

    return {
        'segments':  segments,
        'lrc':       '\n'.join(lrc_lines),
        'language':  result.get('language', 'unknown'),
        'text':      result.get('text', '').strip(),
    }


# ── Endpoints ─────────────────────────────────────────────────────

@karaoke_bp.route('/karaoke/status', methods=['GET'])
def karaoke_status():
    """GET /karaoke/status — check installed libraries."""
    return jsonify({'libraries': check_libs()})


@karaoke_bp.route('/karaoke/separate', methods=['POST'])
def karaoke_separate():
    """
    POST /karaoke/separate
    ──────────────────────
    Body: multipart/form-data
      audio   (required) — music file (MP3/WAV/FLAC)
      mode    (optional) — 'instrumental' | 'vocal_guide' | 'full'
                           default: 'instrumental'

    Returns
    -------
    {
      "mode": "instrumental",
      "vocals_path": "...",
      "instrumental_path": "...",
      "lyrics": { "segments": [...], "lrc": "...", "language": "en" }
    }
    """
    if 'audio' not in request.files:
        return jsonify({'error': 'audio field required'}), 400

    mode = request.form.get('mode', 'instrumental')

    try:
        audio_file = request.files['audio']
        suffix = os.path.splitext(audio_file.filename or '.mp3')[1] or '.mp3'

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=CACHE_DIR) as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        # 1. Separate stems
        stems = separate_stems(tmp_path, CACHE_DIR)

        # 2. Transcribe vocals → LRC lyrics
        lyrics = None
        if stems.get('vocals') and os.path.exists(stems['vocals']):
            lyrics = transcribe_to_lrc(stems['vocals'])

        return jsonify({
            'mode':               mode,
            'vocals_path':        stems.get('vocals'),
            'instrumental_path':  stems.get('instrumental'),
            'lyrics':             lyrics,
            'status':             'ok',
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@karaoke_bp.route('/karaoke/transcribe', methods=['POST'])
def karaoke_transcribe():
    """
    POST /karaoke/transcribe
    ─────────────────────────
    Body: multipart/form-data
      audio  (required) — any audio file

    Returns timestamped lyrics segments + LRC string.
    Used when we only want lyrics without stem separation.
    """
    if 'audio' not in request.files:
        return jsonify({'error': 'audio field required'}), 400

    try:
        audio_file = request.files['audio']
        suffix = os.path.splitext(audio_file.filename or '.mp3')[1] or '.mp3'

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        result = transcribe_to_lrc(tmp_path)
        os.unlink(tmp_path)

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500