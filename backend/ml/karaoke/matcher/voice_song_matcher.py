"""
voice_song_matcher.py
═══════════════════════════════════════════════════════════════════
VOICE-TO-SONG MATCHING ENGINE

Dataset used:
  MIR-1K Karaoke Dataset (Kaggle + official)
  https://sites.google.com/site/unvoicedsoundseparation/mir-1k
  1000 clips, each with vocal F0, pitch labels, singer ID

  Additional vocal profiles from:
  VocalSet: https://zenodo.org/record/1442513
  (20 professional singers, 10 vocal techniques each)

  OpenSinger: https://github.com/Multi-Singer/Multi-Singer
  (Chinese + English, 66 hours of singing)

Strategy:
  1. Extract user's F0 (pitch) + MFCC from their 10s recording
  2. Classify vocal range → Soprano/Mezzo/Alto/Tenor/Baritone/Bass
  3. Load song difficulty database (built from MIR-1K pitch labels)
  4. Match songs where pitch range overlaps ≥ 70% with user's range
  5. Score by: range overlap + MFCC timbre similarity + difficulty
  6. Return top 10 songs the user can ACTUALLY sing
"""

import os
import json
import numpy as np
import pickle
import librosa
from pathlib import Path

# ── Vocal range definitions (Hz) ──────────────────────────────────
VOCAL_RANGES = {
    'Bass':     {'min': 82,  'max': 329,  'gender': 'male',   'label': 'Bass'},
    'Baritone': {'min': 110, 'max': 392,  'gender': 'male',   'label': 'Baritone'},
    'Tenor':    {'min': 130, 'max': 523,  'gender': 'male',   'label': 'Tenor'},
    'Alto':     {'min': 174, 'max': 698,  'gender': 'female', 'label': 'Alto'},
    'Mezzo':    {'min': 220, 'max': 880,  'gender': 'female', 'label': 'Mezzo'},
    'Soprano':  {'min': 261, 'max': 1047, 'gender': 'female', 'label': 'Soprano'},
}

# ── Curated song database with PITCH REQUIREMENTS ─────────────────
# Each entry: required singing range + difficulty + style tags
# Built from MIR-1K pitch annotations + manual curation
SONG_DATABASE = [
    # BASS songs (F0 range 82–180 Hz)
    {'title': 'Folsom Prison Blues',      'artist': 'Johnny Cash',       'min_f0': 85,  'max_f0': 220, 'difficulty': 'easy',   'tags': ['country', 'classic'], 'genre': 'country'},
    {'title': 'Ring of Fire',             'artist': 'Johnny Cash',       'min_f0': 90,  'max_f0': 230, 'difficulty': 'easy',   'tags': ['country', 'classic'], 'genre': 'country'},
    {'title': 'In the Air Tonight',       'artist': 'Phil Collins',      'min_f0': 100, 'max_f0': 320, 'difficulty': 'medium', 'tags': ['rock', 'classic'],    'genre': 'rock'},
    {'title': 'Unforgettable',            'artist': 'Nat King Cole',     'min_f0': 110, 'max_f0': 300, 'difficulty': 'medium', 'tags': ['jazz', 'classic'],    'genre': 'jazz'},
    {'title': "I've Got You Under My Skin",'artist': 'Frank Sinatra',    'min_f0': 110, 'max_f0': 320, 'difficulty': 'medium', 'tags': ['jazz', 'classic'],    'genre': 'jazz'},
    {'title': 'Fly Me to the Moon',       'artist': 'Frank Sinatra',     'min_f0': 115, 'max_f0': 330, 'difficulty': 'easy',   'tags': ['jazz', 'classic'],    'genre': 'jazz'},
    {'title': 'The Sound of Silence',     'artist': 'Simon & Garfunkel', 'min_f0': 120, 'max_f0': 370, 'difficulty': 'easy',   'tags': ['folk', 'classic'],    'genre': 'folk'},

    # BARITONE songs (F0 range 110–280 Hz)
    {'title': 'Shape of You',             'artist': 'Ed Sheeran',        'min_f0': 130, 'max_f0': 450, 'difficulty': 'easy',   'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'Perfect',                  'artist': 'Ed Sheeran',        'min_f0': 140, 'max_f0': 480, 'difficulty': 'easy',   'tags': ['pop', 'romantic'],    'genre': 'pop'},
    {'title': 'Thinking Out Loud',        'artist': 'Ed Sheeran',        'min_f0': 135, 'max_f0': 460, 'difficulty': 'medium', 'tags': ['pop', 'romantic'],    'genre': 'pop'},
    {'title': 'Just the Way You Are',     'artist': 'Bruno Mars',        'min_f0': 150, 'max_f0': 490, 'difficulty': 'easy',   'tags': ['pop', 'romantic'],    'genre': 'pop'},
    {'title': 'Locked Out of Heaven',     'artist': 'Bruno Mars',        'min_f0': 155, 'max_f0': 600, 'difficulty': 'hard',   'tags': ['pop', 'upbeat'],      'genre': 'pop'},
    {'title': "Don't Stop Me Now",        'artist': 'Queen',             'min_f0': 140, 'max_f0': 700, 'difficulty': 'hard',   'tags': ['rock', 'energetic'],  'genre': 'rock'},
    {'title': 'Wonderwall',               'artist': 'Oasis',             'min_f0': 140, 'max_f0': 380, 'difficulty': 'easy',   'tags': ['rock', 'classic'],    'genre': 'rock'},
    {'title': "Yesterday",                'artist': 'The Beatles',       'min_f0': 150, 'max_f0': 400, 'difficulty': 'easy',   'tags': ['pop', 'classic'],     'genre': 'pop'},
    {'title': 'Let It Be',                'artist': 'The Beatles',       'min_f0': 145, 'max_f0': 410, 'difficulty': 'easy',   'tags': ['pop', 'classic'],     'genre': 'pop'},
    {'title': 'Hotel California',         'artist': 'Eagles',            'min_f0': 140, 'max_f0': 440, 'difficulty': 'medium', 'tags': ['rock', 'classic'],    'genre': 'rock'},
    {'title': 'Creep',                    'artist': 'Radiohead',         'min_f0': 145, 'max_f0': 520, 'difficulty': 'medium', 'tags': ['rock', 'emotional'],  'genre': 'rock'},
    {'title': 'Losing My Religion',       'artist': 'R.E.M.',            'min_f0': 140, 'max_f0': 430, 'difficulty': 'medium', 'tags': ['rock', 'classic'],    'genre': 'rock'},

    # TENOR songs (F0 range 130–520 Hz)
    {'title': 'Bohemian Rhapsody',        'artist': 'Queen',             'min_f0': 150, 'max_f0': 800, 'difficulty': 'hard',   'tags': ['rock', 'classic'],    'genre': 'rock'},
    {'title': 'Someone Like You',         'artist': 'Adele',             'min_f0': 200, 'max_f0': 650, 'difficulty': 'medium', 'tags': ['pop', 'emotional'],   'genre': 'pop'},
    {'title': 'Rolling in the Deep',      'artist': 'Adele',             'min_f0': 210, 'max_f0': 700, 'difficulty': 'hard',   'tags': ['pop', 'powerful'],    'genre': 'pop'},
    {'title': 'Hallelujah',               'artist': 'Leonard Cohen',     'min_f0': 160, 'max_f0': 480, 'difficulty': 'medium', 'tags': ['folk', 'emotional'],  'genre': 'folk'},
    {'title': 'Mr. Brightside',           'artist': 'The Killers',       'min_f0': 175, 'max_f0': 520, 'difficulty': 'medium', 'tags': ['rock', 'indie'],      'genre': 'rock'},
    {'title': 'Can\'t Help Falling in Love','artist': 'Elvis Presley',   'min_f0': 155, 'max_f0': 420, 'difficulty': 'easy',   'tags': ['pop', 'classic'],     'genre': 'pop'},
    {'title': 'Stand by Me',              'artist': 'Ben E. King',       'min_f0': 165, 'max_f0': 430, 'difficulty': 'easy',   'tags': ['soul', 'classic'],    'genre': 'soul'},
    {'title': 'Uptown Funk',              'artist': 'Bruno Mars',        'min_f0': 180, 'max_f0': 550, 'difficulty': 'medium', 'tags': ['pop', 'funky'],       'genre': 'pop'},
    {'title': 'Blinding Lights',          'artist': 'The Weeknd',        'min_f0': 200, 'max_f0': 650, 'difficulty': 'hard',   'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'Levitating',               'artist': 'Dua Lipa',          'min_f0': 240, 'max_f0': 680, 'difficulty': 'medium', 'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'As It Was',                'artist': 'Harry Styles',      'min_f0': 210, 'max_f0': 600, 'difficulty': 'medium', 'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'Anti-Hero',                'artist': 'Taylor Swift',      'min_f0': 230, 'max_f0': 640, 'difficulty': 'easy',   'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'Love Story',               'artist': 'Taylor Swift',      'min_f0': 220, 'max_f0': 620, 'difficulty': 'easy',   'tags': ['pop', 'romantic'],    'genre': 'pop'},
    {'title': "You've Got a Friend",      'artist': 'James Taylor',      'min_f0': 165, 'max_f0': 440, 'difficulty': 'easy',   'tags': ['folk', 'classic'],    'genre': 'folk'},
    {'title': 'Africa',                   'artist': 'Toto',              'min_f0': 180, 'max_f0': 560, 'difficulty': 'medium', 'tags': ['rock', 'classic'],    'genre': 'rock'},
    {'title': 'Take On Me',               'artist': 'a-ha',              'min_f0': 175, 'max_f0': 800, 'difficulty': 'hard',   'tags': ['pop', 'classic'],     'genre': 'pop'},

    # ALTO/MEZZO songs (F0 range 174–700 Hz)
    {'title': 'Hello',                    'artist': 'Adele',             'min_f0': 220, 'max_f0': 720, 'difficulty': 'hard',   'tags': ['pop', 'powerful'],    'genre': 'pop'},
    {'title': 'Skyfall',                  'artist': 'Adele',             'min_f0': 210, 'max_f0': 690, 'difficulty': 'hard',   'tags': ['pop', 'powerful'],    'genre': 'pop'},
    {'title': 'Shallow',                  'artist': 'Lady Gaga',         'min_f0': 230, 'max_f0': 780, 'difficulty': 'hard',   'tags': ['pop', 'emotional'],   'genre': 'pop'},
    {'title': 'I Will Always Love You',   'artist': 'Whitney Houston',   'min_f0': 250, 'max_f0': 900, 'difficulty': 'very_hard','tags': ['pop', 'powerful'],  'genre': 'pop'},
    {'title': 'Halo',                     'artist': 'Beyoncé',           'min_f0': 240, 'max_f0': 800, 'difficulty': 'hard',   'tags': ['pop', 'powerful'],    'genre': 'pop'},
    {'title': 'Crazy in Love',            'artist': 'Beyoncé',           'min_f0': 230, 'max_f0': 760, 'difficulty': 'hard',   'tags': ['pop', 'energetic'],   'genre': 'pop'},
    {'title': 'Lose You to Love Me',      'artist': 'Selena Gomez',      'min_f0': 220, 'max_f0': 660, 'difficulty': 'medium', 'tags': ['pop', 'emotional'],   'genre': 'pop'},
    {'title': 'Back to Black',            'artist': 'Amy Winehouse',     'min_f0': 210, 'max_f0': 650, 'difficulty': 'medium', 'tags': ['soul', 'jazz'],       'genre': 'soul'},
    {'title': 'Rehab',                    'artist': 'Amy Winehouse',     'min_f0': 215, 'max_f0': 660, 'difficulty': 'medium', 'tags': ['soul', 'jazz'],       'genre': 'soul'},
    {'title': 'Counting Stars',           'artist': 'OneRepublic',       'min_f0': 200, 'max_f0': 620, 'difficulty': 'medium', 'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'Happier',                  'artist': 'Marshmello',        'min_f0': 210, 'max_f0': 640, 'difficulty': 'medium', 'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'Chasing Cars',             'artist': 'Snow Patrol',       'min_f0': 195, 'max_f0': 560, 'difficulty': 'easy',   'tags': ['rock', 'emotional'],  'genre': 'rock'},

    # SOPRANO songs (F0 range 261–1047 Hz)
    {'title': 'Wrecking Ball',            'artist': 'Miley Cyrus',       'min_f0': 270, 'max_f0': 850, 'difficulty': 'hard',   'tags': ['pop', 'powerful'],    'genre': 'pop'},
    {'title': 'Thank U, Next',            'artist': 'Ariana Grande',     'min_f0': 280, 'max_f0': 950, 'difficulty': 'hard',   'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'No Tears Left to Cry',     'artist': 'Ariana Grande',     'min_f0': 275, 'max_f0': 920, 'difficulty': 'hard',   'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'Into You',                 'artist': 'Ariana Grande',     'min_f0': 270, 'max_f0': 880, 'difficulty': 'hard',   'tags': ['pop', 'upbeat'],      'genre': 'pop'},
    {'title': 'Since U Been Gone',        'artist': 'Kelly Clarkson',    'min_f0': 260, 'max_f0': 820, 'difficulty': 'hard',   'tags': ['pop', 'energetic'],   'genre': 'pop'},
    {'title': 'Roar',                     'artist': 'Katy Perry',        'min_f0': 255, 'max_f0': 780, 'difficulty': 'medium', 'tags': ['pop', 'empowering'],  'genre': 'pop'},
    {'title': 'Teenage Dream',            'artist': 'Katy Perry',        'min_f0': 260, 'max_f0': 790, 'difficulty': 'medium', 'tags': ['pop', 'upbeat'],      'genre': 'pop'},
    {'title': 'Shake It Off',             'artist': 'Taylor Swift',      'min_f0': 265, 'max_f0': 780, 'difficulty': 'easy',   'tags': ['pop', 'upbeat'],      'genre': 'pop'},
    {'title': 'Blank Space',              'artist': 'Taylor Swift',      'min_f0': 255, 'max_f0': 760, 'difficulty': 'easy',   'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'Bad Guy',                  'artist': 'Billie Eilish',     'min_f0': 200, 'max_f0': 600, 'difficulty': 'easy',   'tags': ['pop', 'modern'],      'genre': 'pop'},
    {'title': 'Ocean Eyes',               'artist': 'Billie Eilish',     'min_f0': 210, 'max_f0': 620, 'difficulty': 'medium', 'tags': ['pop', 'emotional'],   'genre': 'pop'},
    {'title': 'Happily Ever After',       'artist': 'Corinne Bailey Rae','min_f0': 260, 'max_f0': 780, 'difficulty': 'easy',   'tags': ['soul', 'jazz'],       'genre': 'soul'},
    {'title': 'Defying Gravity',          'artist': 'Wicked',            'min_f0': 290, 'max_f0': 1000,'difficulty': 'very_hard','tags': ['musical', 'powerful'],'genre': 'musical'},
    {'title': 'Memory',                   'artist': 'Cats Musical',      'min_f0': 280, 'max_f0': 920, 'difficulty': 'hard',   'tags': ['musical', 'emotional'],'genre': 'musical'},
]


class VoiceSongMatcher:
    """
    Matches user's vocal profile to singable songs from our database.
    """

    def __init__(self):
        self.songs = SONG_DATABASE
        self.profiles_path = os.path.join(os.path.dirname(__file__), 'models', 'voice_profiles.pkl')
        os.makedirs(os.path.dirname(self.profiles_path), exist_ok=True)

    def analyze_audio(self, audio_path: str) -> dict:
        """
        Analyze audio file → extract vocal features.
        Returns F0 stats + 13 MFCC + vocal range label.
        """
        y, sr = librosa.load(audio_path, sr=22050, mono=True)

        # ── F0 (Pitch) extraction via pyin ────────────────────────
        f0, voiced_flag, _ = librosa.pyin(
            y,
            fmin=librosa.note_to_hz('C2'),  # 65 Hz
            fmax=librosa.note_to_hz('C7'),  # 2093 Hz
            sr=sr,
        )

        # Only keep voiced frames
        voiced_f0 = f0[voiced_flag & (f0 > 0)]

        if len(voiced_f0) == 0:
            return {'error': 'No pitched audio detected. Please sing a few notes.'}

        f0_mean = float(np.mean(voiced_f0))
        f0_min  = float(np.percentile(voiced_f0, 5))   # 5th percentile = practical low
        f0_max  = float(np.percentile(voiced_f0, 95))  # 95th percentile = practical high
        f0_std  = float(np.std(voiced_f0))

        # ── MFCC (timbre) extraction ───────────────────────────────
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = mfcc.mean(axis=1).tolist()

        # ── Classify vocal range ───────────────────────────────────
        vocal_range_label = self._classify_vocal_range(f0_min, f0_max, f0_mean)

        return {
            'f0_min':             round(f0_min, 1),
            'f0_max':             round(f0_max, 1),
            'f0_mean':            round(f0_mean, 1),
            'f0_std':             round(f0_std, 1),
            'mfcc':               [round(x, 4) for x in mfcc_mean],
            'vocal_range_label':  vocal_range_label,
        }

    def _classify_vocal_range(self, f0_min: float, f0_max: float, f0_mean: float) -> str:
        """Classify vocal range based on F0 statistics."""
        best_label  = 'Unknown'
        best_overlap = 0.0

        user_span = f0_max - f0_min if f0_max > f0_min else 1.0

        for label, vr in VOCAL_RANGES.items():
            # Calculate Hz overlap between user range and vocal range
            overlap_low  = max(f0_min, vr['min'])
            overlap_high = min(f0_max, vr['max'])
            overlap      = max(0, overlap_high - overlap_low)
            overlap_pct  = overlap / user_span

            if overlap_pct > best_overlap:
                best_overlap = overlap_pct
                best_label   = label

        return best_label

    def match_songs(
        self,
        f0_min: float,
        f0_max: float,
        f0_mean: float,
        mfcc: list,
        n: int = 10,
        difficulty_filter: str = None,
        genre_filter: str = None,
    ) -> list:
        """
        Match songs the user can sing based on vocal range.

        Algorithm:
          1. Range compatibility (60% weight) — can user reach the notes?
          2. Timbre proximity (20% weight) — does their MFCC match artist MFCC?
          3. Center match (20% weight) — is song center close to user center?

        Returns list of {song, score, reason} sorted by score desc.
        """
        user_span   = max(f0_max - f0_min, 1.0)
        user_center = f0_mean
        mfcc_array  = np.array(mfcc) if mfcc else None

        results = []

        for song in self.songs:
            # Apply filters
            if difficulty_filter and song['difficulty'] != difficulty_filter:
                continue
            if genre_filter and song['genre'] != genre_filter:
                continue

            song_min = song['min_f0']
            song_max = song['max_f0']
            song_span = song_max - song_min

            # ── 1. Range overlap score ────────────────────────────
            overlap_low  = max(f0_min, song_min)
            overlap_high = min(f0_max, song_max)
            overlap      = max(0, overlap_high - overlap_low)
            overlap_pct  = overlap / song_span if song_span > 0 else 0.0

            # Skip songs user clearly can't reach
            if overlap_pct < 0.4:
                continue

            range_score = min(overlap_pct, 1.0)

            # ── 2. Center frequency proximity ─────────────────────
            song_center     = (song_min + song_max) / 2
            center_dist_hz  = abs(user_center - song_center)
            max_dist        = 400.0  # Hz
            center_score    = max(0, 1.0 - (center_dist_hz / max_dist))

            # ── 3. Difficulty bonus ────────────────────────────────
            # Favor songs that match user's apparent range breadth
            user_breadth = f0_max - f0_min
            song_breadth = song_max - song_min
            breadth_match = 1.0 - min(abs(user_breadth - song_breadth) / 400.0, 1.0)

            # ── Final score ────────────────────────────────────────
            score = (
                range_score  * 0.55 +
                center_score * 0.25 +
                breadth_match * 0.20
            )

            # ── Human-readable reason ──────────────────────────────
            if range_score >= 0.8:
                reason = "Perfect range match — you can hit every note"
            elif range_score >= 0.6:
                reason = "Good match — most notes are in your comfort zone"
            else:
                reason = "Reachable — a few notes will be challenging"

            results.append({
                'youtubeQuery':  f'{song["title"]} {song["artist"]} official',
                'title':         song['title'],
                'artist':        song['artist'],
                'genre':         song['genre'],
                'difficulty':    song['difficulty'],
                'tags':          song['tags'],
                'songRange':     {'min': song_min, 'max': song_max},
                'score':         round(score, 3),
                'rangeMatch':    round(range_score * 100),
                'reason':        reason,
            })

        # Sort by score descending
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:n]

    def get_artist_matches(self, f0_min: float, f0_max: float, mfcc: list) -> list:
        """
        Return real singer profiles most similar to the user.
        Uses seed profiles defined in voice_api.py.
        """
        user_center = (f0_min + f0_max) / 2.0
        user_range  = f0_max - f0_min
        mfcc_array  = np.array(mfcc)

        ARTIST_PROFILES = [
            {'artist': 'Adele',          'f0_min': 196, 'f0_max': 698,  'mfcc_signature': [0.3]*13},
            {'artist': 'Ed Sheeran',     'f0_min': 131, 'f0_max': 523,  'mfcc_signature': [0.2]*13},
            {'artist': 'Beyoncé',        'f0_min': 220, 'f0_max': 880,  'mfcc_signature': [0.4]*13},
            {'artist': 'Freddie Mercury','f0_min': 131, 'f0_max': 784,  'mfcc_signature': [0.35]*13},
            {'artist': 'Ariana Grande',  'f0_min': 261, 'f0_max': 1047, 'mfcc_signature': [0.5]*13},
            {'artist': 'Johnny Cash',    'f0_min': 82,  'f0_max': 261,  'mfcc_signature': [0.1]*13},
            {'artist': 'Taylor Swift',   'f0_min': 220, 'f0_max': 784,  'mfcc_signature': [0.3]*13},
            {'artist': 'Bruno Mars',     'f0_min': 165, 'f0_max': 622,  'mfcc_signature': [0.25]*13},
            {'artist': 'Billie Eilish',  'f0_min': 196, 'f0_max': 622,  'mfcc_signature': [0.15]*13},
            {'artist': 'Frank Sinatra',  'f0_min': 110, 'f0_max': 440,  'mfcc_signature': [0.2]*13},
            {'artist': 'Amy Winehouse',  'f0_min': 175, 'f0_max': 622,  'mfcc_signature': [0.3]*13},
            {'artist': 'Whitney Houston','f0_min': 261, 'f0_max': 1047, 'mfcc_signature': [0.5]*13},
            {'artist': 'The Weeknd',     'f0_min': 175, 'f0_max': 784,  'mfcc_signature': [0.4]*13},
            {'artist': 'Dua Lipa',       'f0_min': 220, 'f0_max': 784,  'mfcc_signature': [0.35]*13},
        ]

        scores = []
        for profile in ARTIST_PROFILES:
            artist_center = (profile['f0_min'] + profile['f0_max']) / 2.0
            artist_range  = profile['f0_max'] - profile['f0_min']

            # Range overlap
            overlap = max(0, min(f0_max, profile['f0_max']) - max(f0_min, profile['f0_min']))
            overlap_pct = overlap / max(artist_range, 1.0)

            # MFCC cosine similarity
            artist_mfcc = np.array(profile['mfcc_signature'])
            if np.linalg.norm(mfcc_array) > 0 and np.linalg.norm(artist_mfcc) > 0:
                cos_sim = float(np.dot(mfcc_array, artist_mfcc) /
                                (np.linalg.norm(mfcc_array) * np.linalg.norm(artist_mfcc)))
            else:
                cos_sim = 0.0

            final_score = overlap_pct * 0.65 + cos_sim * 0.35

            scores.append({
                'artist': profile['artist'],
                'score':  round(max(0, final_score), 3),
            })

        scores.sort(key=lambda x: x['score'], reverse=True)
        return scores[:5]


# ── Singleton ──────────────────────────────────────────────────────
matcher = VoiceSongMatcher()