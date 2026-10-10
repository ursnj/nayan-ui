"""Synthesizes Orb Rush's sound effects and music into assets/sfx/*.wav (stdlib only).

Run from the example directory:  python3 scripts/make-sounds.py
"""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
OUT = Path(__file__).resolve().parent.parent / "assets" / "sfx"
random.seed(7)


def note(freq, dur, wave_fn, attack=0.005, decay=None, volume=1.0):
    """One note: oscillator `wave_fn(phase)` with an attack ramp and exponential decay."""
    n = int(dur * RATE)
    decay = decay if decay is not None else dur / 4
    out = []
    phase = 0.0
    for i in range(n):
        t = i / RATE
        env = min(1.0, t / attack) * math.exp(-t / decay)
        env *= min(1.0, (n - i) / (0.004 * RATE))  # tiny release: no click at the end
        out.append(wave_fn(phase) * env * volume)
        phase += freq / RATE
    return out


def sine(p):
    return math.sin(2 * math.pi * p)


def soft_square(p):
    return sine(p) + sine(3 * p) / 3 + sine(5 * p) / 5


def triangle(p):
    return 4 * abs((p % 1) - 0.5) - 1


def mix_into(buf, samples, at):
    start = int(at * RATE)
    if len(buf) < start + len(samples):
        buf.extend([0.0] * (start + len(samples) - len(buf)))
    for i, s in enumerate(samples):
        buf[start + i] += s


def write(name, samples, peak=0.9):
    m = max(1e-9, max(abs(s) for s in samples))
    scale = peak / m
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s * scale)) * 32767)) for s in samples))
    print(f"{name}.wav  {len(samples) / RATE:.2f}s")


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def pickup():
    buf = []
    mix_into(buf, note(midi(88), 0.09, soft_square, decay=0.05), 0.0)   # E6
    mix_into(buf, note(midi(95), 0.16, soft_square, decay=0.07), 0.06)  # B6
    return buf


def dash():
    n = int(0.28 * RATE)
    out, y = [], 0.0
    for i in range(n):
        t = i / RATE
        cutoff = 0.35 * math.exp(-t / 0.12) + 0.02  # one-pole low-pass sweeping down
        y += cutoff * (random.uniform(-1, 1) - y)
        out.append(y * min(1, t / 0.01) * math.exp(-t / 0.1))
    return out


def bump():
    n = int(0.2 * RATE)
    out, phase = [], 0.0
    for i in range(n):
        t = i / RATE
        freq = 60 + 90 * math.exp(-t / 0.03)  # pitch drops: a soft thud
        phase += freq / RATE
        click = random.uniform(-1, 1) * math.exp(-t / 0.004) * 0.4
        out.append((sine(phase) * math.exp(-t / 0.06)) + click)
    return out


def gameover():
    buf = []
    for k, m in enumerate([69, 65, 62, 57]):  # A4 F4 D4 A3, falling
        mix_into(buf, note(midi(m), 0.32, triangle, decay=0.18), k * 0.17)
    return buf


def flap():
    """Soft wing beat: a band of noise with a quick rise and fall."""
    n = int(0.12 * RATE)
    out, lo, hi = [], 0.0, 0.0
    for i in range(n):
        t = i / RATE
        x = random.uniform(-1, 1)
        lo += 0.25 * (x - lo)  # low-pass ...
        hi += 0.08 * (lo - hi)  # ... minus a slower low-pass = band-pass
        env = math.sin(math.pi * min(1.0, t / 0.12)) ** 2
        out.append((lo - hi) * env)
    return out


def point():
    buf = []
    mix_into(buf, note(midi(83), 0.10, soft_square, decay=0.06, volume=0.8), 0.0)   # B5
    mix_into(buf, note(midi(90), 0.30, soft_square, decay=0.12), 0.08)              # F#6
    return buf


def hit():
    n = int(0.25 * RATE)
    out, phase = [], 0.0
    for i in range(n):
        t = i / RATE
        freq = 90 + 400 * math.exp(-t / 0.015)
        phase += freq / RATE
        smack = random.uniform(-1, 1) * math.exp(-t / 0.008)
        out.append(sine(phase) * math.exp(-t / 0.07) * 0.9 + smack * 0.8)
    return out


def die():
    """Falling whistle."""
    n = int(0.6 * RATE)
    out, phase = [], 0.0
    for i in range(n):
        t = i / RATE
        freq = 900 * math.exp(-t / 0.35) + 150
        phase += freq / RATE
        release = min(1.0, (n - i) / (0.01 * RATE))  # fade out: no click at the end
        out.append(triangle(phase) * min(1, t / 0.02) * math.exp(-t / 0.4) * release)
    return out


def music():
    bpm = 120
    beat = 60 / bpm
    bars = 4
    buf = [0.0] * int(bars * 4 * beat * RATE)
    chords = [(57, [69, 72, 76]), (53, [69, 72, 77]), (48, [67, 72, 76]), (55, [67, 71, 74])]  # Am F C G
    for bar, (root, arp) in enumerate(chords):
        t0 = bar * 4 * beat
        for b in range(4):  # bass on every beat
            mix_into(buf, note(midi(root - 12), beat * 0.9, triangle, decay=0.25, volume=0.55), t0 + b * beat)
        for e in range(8):  # eighth-note arpeggio
            m = arp[e % 3] + (12 if e in (3, 7) else 0)
            mix_into(buf, note(midi(m), beat * 0.45, sine, decay=0.09, volume=0.22), t0 + e * beat / 2)
        for e in range(8):  # soft hi-hat
            hat = [random.uniform(-1, 1) * math.exp(-(i / RATE) / 0.012) for i in range(int(0.04 * RATE))]
            mix_into(buf, [h * (0.07 if e % 2 else 0.04) for h in hat], t0 + e * beat / 2)
    buf = buf[: int(bars * 4 * beat * RATE)]  # exact loop length
    ramp = int(0.002 * RATE)  # 2 ms fade-in so the loop seam (last sample ~0) doesn't click
    for i in range(ramp):
        buf[i] *= i / ramp
    return buf


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    write("pickup", pickup())
    write("dash", dash(), peak=0.7)
    write("bump", bump())
    write("gameover", gameover())
    write("music", music(), peak=0.6)
    write("flap", flap(), peak=0.6)
    write("point", point())
    write("hit", hit())
    write("die", die(), peak=0.7)
