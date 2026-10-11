"""Synthesizes the Flappy example's sound effects into assets/sfx/*.wav (stdlib only).

Run from the example directory:  python3 scripts/make-sounds.py
"""
import math
import sys
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




def engine():
    """A one-second engine hum that loops seamlessly: whole cycles of every partial."""
    n = RATE
    out = []
    for i in range(n):
        t = i / RATE
        # 55 Hz firing with harmonics, a slower 7 Hz throb, and a little grit.
        v = 0.0
        for k, amp in ((1, 1.0), (2, 0.55), (3, 0.35), (4, 0.2), (6, 0.12)):
            v += amp * soft_square(55 * k * t) / k
        v *= 0.75 + 0.25 * sine(7 * t)
        v += random.uniform(-1, 1) * 0.04
        out.append(v)
    return out


def nitro():
    """Whoosh: noise through a low-pass that opens up, then fades."""
    n = int(0.9 * RATE)
    out, y = [], 0.0
    for i in range(n):
        t = i / RATE
        cutoff = 0.04 + 0.4 * min(1.0, t / 0.25)
        y += cutoff * (random.uniform(-1, 1) - y)
        out.append(y * min(1, t / 0.03) * math.exp(-max(0.0, t - 0.2) / 0.25))
    return out


if __name__ == "__main__":
    # Pass names (e.g. `engine nitro`) to write only those.
    only = set(sys.argv[1:])
    OUT.mkdir(parents=True, exist_ok=True)
    sounds = {
        "bump": lambda: write("bump", bump()),
        "flap": lambda: write("flap", flap(), peak=0.6),
        "point": lambda: write("point", point()),
        "hit": lambda: write("hit", hit()),
        "die": lambda: write("die", die(), peak=0.7),
        "engine": lambda: write("engine", engine(), peak=0.5),
        "nitro": lambda: write("nitro", nitro(), peak=0.8),
    }
    for name, make in sounds.items():
        if not only or name in only:
            make()
