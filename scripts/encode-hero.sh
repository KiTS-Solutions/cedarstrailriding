#!/usr/bin/env bash
# Encode the scroll-scrub hero from the 4K master. All-intra (-g 1) so every frame is a
# keyframe: scroll-driven currentTime seeks stay instant.
# Usage: scripts/encode-hero.sh <master.mp4> [crop_x0=0.5] [crop_x1=0.5]
#   crop_x0/x1: 0..1 position of the portrait crop window at clip start / end
#   (0 = far left, 1 = far right). Different values pan the crop to follow the horse.
# Env: DESKTOP_CRF (default 24), MOBILE_CRF (default 26)
set -euo pipefail

SRC="${1:?usage: encode-hero.sh <master.mp4> [crop_x0] [crop_x1]}"
X0="${2:-0.5}"
X1="${3:-0.5}"
OUT="public/images/hero"
mkdir -p "$OUT"

DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")"
COMMON=(-an -c:v libx264 -preset slow -g 1 -pix_fmt yuv420p -movflags +faststart -r 24)

# Desktop 16:9
ffmpeg -y -i "$SRC" "${COMMON[@]}" -crf "${DESKTOP_CRF:-24}" \
  -vf "scale=1280:720:flags=lanczos" "$OUT/ride-desktop.mp4"

# Mobile 9:16: crop a portrait window that pans from X0 to X1, then scale.
CROP="crop=w=ih*9/16:h=ih:x=(iw-ih*9/16)*(${X0}+(${X1}-${X0})*t/${DUR}):y=0"
ffmpeg -y -i "$SRC" "${COMMON[@]}" -crf "${MOBILE_CRF:-26}" \
  -vf "${CROP},scale=540:960:flags=lanczos" "$OUT/ride-mobile.mp4"

# Posters = frame t=0 so the canvas cross-fade is seamless.
ffmpeg -y -ss 0 -i "$OUT/ride-desktop.mp4" -frames:v 1 -vf "scale=1600:-2" -c:v libwebp -quality 78 "$OUT/poster-desktop.webp"
ffmpeg -y -ss 0 -i "$OUT/ride-mobile.mp4" -frames:v 1 -c:v libwebp -quality 78 "$OUT/poster-mobile.webp"

ls -l "$OUT"
