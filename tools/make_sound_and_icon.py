"""Generates the default alarm-clock sound and the app icon (both original,
free to use).  Run:  python3 tools/make_sound_and_icon.py
"""
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"


def make_alarm():
    sr = 44100
    total = 3.0
    t = np.arange(int(sr * total)) / sr
    out = np.zeros_like(t)
    # Two bells struck alternately by a fast hammer, in bursts: ring-ring ... ring-ring
    bursts = [(0.0, 0.8), (1.1, 1.9), (2.2, 2.95)]
    strike_rate = 22.0
    bells = [(2350.0, 1.0), (2750.0, 0.9)]
    for start, end in bursts:
        k = 0
        s = start
        while s < end:
            f0, amp = bells[k % 2]
            idx = (t >= s)
            tt = t[idx] - s
            env = np.exp(-tt * 28)
            tone = (np.sin(2 * np.pi * f0 * tt) + 0.45 * np.sin(2 * np.pi * f0 * 2.76 * tt)
                    + 0.25 * np.sin(2 * np.pi * f0 * 5.4 * tt) * np.exp(-tt * 60))
            # tiny metallic click at the strike
            click = np.exp(-tt * 900) * np.sin(2 * np.pi * 5200 * tt) * 0.6
            out[idx] += amp * env * tone + click
            s += 1.0 / strike_rate
            k += 1
    out /= np.max(np.abs(out))
    out *= 0.7
    pcm = (out * 32767).astype(np.int16)
    path = ASSETS / "sounds" / "alarm-clock.wav"
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    print("wrote", path)


def make_icon():
    S = 1024
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # gingham tile background
    d.rounded_rectangle((32, 32, S - 32, S - 32), radius=220, fill=(206, 223, 190, 255))
    tile = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile)
    step = 160
    for i in range(-1, 8):
        td.rectangle((i * step * 2 + step, 0, i * step * 2 + 2 * step, S), fill=(150, 190, 110, 90))
        td.rectangle((0, i * step * 2 + step, S, i * step * 2 + 2 * step), fill=(150, 190, 110, 90))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle((32, 32, S - 32, S - 32), radius=220, fill=255)
    im.paste(Image.alpha_composite(im, tile), (0, 0), mask)
    d = ImageDraw.Draw(im)
    # paper with shadow
    d.rounded_rectangle((210, 250, 830, 860), radius=60, fill=(60, 80, 40, 70))
    d.rounded_rectangle((190, 220, 810, 830), radius=60, fill=(255, 255, 255, 255))
    # dark green header like the design's tag
    d.rounded_rectangle((190, 220, 810, 400), radius=60, fill=(75, 99, 51, 255))
    d.rectangle((190, 340, 810, 400), fill=(75, 99, 51, 255))
    # checkmark lines
    for i, y in enumerate((490, 600, 710)):
        d.rounded_rectangle((260, y - 34, 328, y + 34), radius=14, outline=(40, 40, 40, 255), width=12)
        d.rounded_rectangle((370, y - 12, 740 - i * 90, y + 12), radius=12, fill=(160, 195, 127, 255))
    d.line((272, 490, 292, 512, 322, 466), fill=(230, 60, 90, 255), width=16, joint="curve")
    # red pin
    d.ellipse((450, 140, 570, 260), fill=(178, 20, 45, 255))
    d.ellipse((475, 160, 520, 200), fill=(235, 110, 120, 255))
    path = ASSETS / "icon.png"
    im.save(path)
    im.resize((256, 256), Image.LANCZOS).save(ASSETS / "icon-256.png")
    im.save(ASSETS / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("wrote icons")


if __name__ == "__main__":
    make_alarm()
    make_icon()
