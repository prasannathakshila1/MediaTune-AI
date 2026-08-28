# backend/ml/voice/voice_api.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import tempfile
import traceback
from flask import Blueprint, request, jsonify
from karaoke.matcher.voice_song_matcher import matcher

voice_bp = Blueprint('voice', __name__)


@voice_bp.route('/analyze-voice', methods=['POST'])
def analyze_voice():
    """
    POST /analyze-voice
    """
    if 'audio' not in request.files:
        return jsonify({'error': 'audio field required'}), 400

    audio_file = request.files['audio']
    difficulty = request.form.get('difficulty', None)
    genre      = request.form.get('genre', None)

    # Print request info for debugging
    print(f"\n📥 Received voice analysis request")
    print(f"   Filename: {audio_file.filename}")
    print(f"   Content type: {audio_file.content_type}")
    print(f"   Difficulty: {difficulty}")
    print(f"   Genre: {genre}")

    try:
        suffix = os.path.splitext(audio_file.filename or '.wav')[1] or '.wav'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name
            print(f"   Saved temp file: {tmp_path}")
            print(f"   File size: {os.path.getsize(tmp_path)} bytes")

        # ── 1. Analyze audio ─────────────────────────────────────
        print(f"   Analyzing audio with librosa...")
        features = matcher.analyze_audio(tmp_path)
        os.unlink(tmp_path)

        if 'error' in features:
            print(f"   ❌ Analysis error: {features['error']}")
            return jsonify({'error': features['error']}), 422

        print(f"   ✅ Audio analysis complete")
        print(f"   Vocal range: {features['vocal_range_label']}")
        print(f"   F0 range: {features['f0_min']} - {features['f0_max']} Hz")

        # ── 2. Match songs user can SING ─────────────────────────
        print(f"   Matching songs...")
        recommended_songs = matcher.match_songs(
            f0_min=features['f0_min'],
            f0_max=features['f0_max'],
            f0_mean=features['f0_mean'],
            mfcc=features['mfcc'],
            n=10,
            difficulty_filter=difficulty,
            genre_filter=genre,
        )
        print(f"   ✅ Found {len(recommended_songs)} songs")

        # ── 3. Match similar artists ─────────────────────────────
        print(f"   Matching artists...")
        matched_artists = matcher.get_artist_matches(
            f0_min=features['f0_min'],
            f0_max=features['f0_max'],
            mfcc=features['mfcc'],
        )
        print(f"   ✅ Found {len(matched_artists)} artists")

        response_data = {
            **features,
            'matched_artists':    matched_artists,
            'recommended_songs':  recommended_songs,
        }
        
        print(f"📤 Sending response with {len(recommended_songs)} songs")
        return jsonify(response_data)

    except Exception as e:
        print(f"\n❌ ERROR in analyze_voice:")
        print(f"   {str(e)}")
        print(f"\n   Full traceback:")
        traceback.print_exc()
        
        # Clean up temp file if it exists
        try:
            if 'tmp_path' in locals():
                os.unlink(tmp_path)
        except:
            pass
            
        return jsonify({'error': str(e)}), 500


@voice_bp.route('/vocal-range', methods=['GET'])
def vocal_range_info():
    """GET /vocal-range — return 6 vocal range labels + Hz boundaries."""
    try:
        from voice_song_matcher import VOCAL_RANGES
        return jsonify({
            'ranges': [
                {'label': k, **v}
                for k, v in VOCAL_RANGES.items()
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500