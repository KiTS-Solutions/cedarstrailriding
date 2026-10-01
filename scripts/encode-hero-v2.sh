#!/usr/bin/env bash
# Encode every v2 media asset from the vertical (9:16) CTR master shot for the site
# (horse-lebflag.MOV — 1080x1920 HEVC, 107 s, four takes cut at 33.3 / 60.6 / 67.8 s).
#
#   hero loop    = clip 1 (drone reveal) -> clip 3 (gallop past camera) -> clip 6 (approach),
#                  joined with XF-second crossfades and played back on its own (autoplay, loop).
#                  Segment lengths are solved so each shot crossfade is centred on an act
#                  hand-off (0.32 and 0.68 of the loop, HERO_SEGMENT_BOUNDARIES in
#                  src/scripts/hero-math.ts), and the tail crossfades into the head so the loop
#                  has no visible seam.
#   loader       = clip 2 flag close-up, seamless loop
#   ambient-group= clip 4 (riding behind the group), seamless loop
#   ambient-ridge= clip 5 (wide sunset ridge), seamless loop
#   ambient-gallop= clip 3 (flag-bearer sprinting at the camera), seamless loop — About backdrop
#
# Usage: scripts/encode-hero-v2.sh <master.MOV>
# Env:   HD_CRF (30) MOBILE_CRF (31) COMPACT_CRF (31) LOOP_CRF (28)
#        DENOISE (hqdn3d=2:2:4:4 — iPhone grain is most of the bitrate)
set -euo pipefail

SRC="${1:?usage: encode-hero-v2.sh <master.MOV>}"
OUT="public/images/hero/v2"
mkdir -p "$OUT"

FPS=24
XF=0.4
# Loop length 13.0 s; shot crossfades centred at 0.32*13 = 4.16 s and 0.68*13 = 8.84 s.
SEG_A=4.36 SEG_B=5.08 SEG_C=4.36
# Source windows (seconds in the master), each exactly its segment's length (real-time):
# only the strongest few seconds of each shot, so the footage moves calmly.
A_IN=5.20 A_OUT=9.56     # drone: riders crossing as the sky warms toward the sunset
B_IN=54.80 B_OUT=59.88   # gallop past camera, flag filling the top of frame
C_IN=102.30 C_OUT=106.66 # flag-bearer arriving out of the sunset

COMMON=(-an -c:v libx264 -preset slow -pix_fmt yuv420p -movflags +faststart)

# hero <w> <h> <crf> <out>
# Segment A starts XF early; the chain [XF, end] is kept and its last XF seconds crossfade into
# the chain's first XF seconds, so the last frame flows into frame 0 (= A_IN) and every shot
# boundary lands where it would without the seam (13.0 s, 0.32 / 0.68).
hero() {
  local w="$1" h="$2" crf="$3" out="$4"
  local s="scale=${w}:${h}:flags=lanczos,${DENOISE:-hqdn3d=2:2:4:4},fps=${FPS},format=yuv420p"
  local a_len b_len c_len total off1 off2 seam
  a_len="$(awk -v a=$SEG_A -v x=$XF 'BEGIN { print a + x }')"
  b_len=$SEG_B c_len=$SEG_C
  off1=$SEG_A
  off2="$(awk -v a="$a_len" -v b=$b_len -v x=$XF 'BEGIN { printf "%.3f", a + b - 2 * x }')"
  total="$(awk -v a="$a_len" -v b=$b_len -v c=$c_len -v x=$XF 'BEGIN { printf "%.3f", a + b + c - 2 * x }')"
  seam="$(awk -v t="$total" -v x=$XF 'BEGIN { printf "%.3f", t - 2 * x }')"
  ffmpeg -hide_banner -loglevel error -y \
    -ss "$(awk -v a=$A_IN -v x=$XF 'BEGIN { print a - x }')" -t "$a_len" -i "$SRC" \
    -ss "$B_IN" -t "$b_len" -i "$SRC" \
    -ss "$C_IN" -t "$c_len" -i "$SRC" \
    -filter_complex "\
[0:v]${s},trim=duration=${a_len},setpts=PTS-STARTPTS[a];\
[1:v]${s},trim=duration=${b_len},setpts=PTS-STARTPTS[b];\
[2:v]${s},trim=duration=${c_len},setpts=PTS-STARTPTS[c];\
[a][b]xfade=transition=fade:duration=${XF}:offset=${off1}[ab];\
[ab][c]xfade=transition=fade:duration=${XF}:offset=${off2}[abc];\
[abc]split[m0][h0];\
[m0]trim=start=${XF},setpts=PTS-STARTPTS[m];\
[h0]trim=duration=${XF},setpts=PTS-STARTPTS[hd];\
[m][hd]xfade=transition=fade:duration=${XF}:offset=${seam}[v]" \
    -map "[v]" "${COMMON[@]}" -r "$FPS" -g 48 -crf "$crf" "$out"
}

# loop <in> <len> <fade> <w> <h> <crf> <out>
# Seamless loop: plays [in+fade, in+len+fade] and crossfades its tail into [in, in+fade],
# so the last frame equals the first.
loop() {
  local in="$1" len="$2" f="$3" w="$4" h="$5" crf="$6" out="$7"
  local s="scale=${w}:${h}:flags=lanczos,fps=${FPS},format=yuv420p"
  local off; off="$(awk -v l="$len" -v f="$f" 'BEGIN { printf "%.3f", l - f }')"
  ffmpeg -hide_banner -loglevel error -y \
    -ss "$(awk -v i="$in" -v f="$f" 'BEGIN{print i+f}')" -t "$len" -i "$SRC" \
    -ss "$in" -t "$f" -i "$SRC" \
    -filter_complex "[0:v]${s},setpts=PTS-STARTPTS[m];[1:v]${s},setpts=PTS-STARTPTS[h];\
[m][h]xfade=transition=fade:duration=${f}:offset=${off}[v]" \
    -map "[v]" "${COMMON[@]}" -r "$FPS" -g 48 -crf "$crf" "$out"
}

# still <video> <out.webp> [filter] [quality]
# The posters are LCP images that sit under a scrim / blur, so a slight softening
# (gblur) roughly halves their weight with no visible loss; the canvas replaces them anyway.
still() {
  ffmpeg -hide_banner -loglevel error -y -i "$1" -frames:v 1 \
    -vf "${3:-null}" -c:v libwebp -quality "${4:-78}" "$2"
}

hero 720 1280 "${HD_CRF:-30}" "$OUT/play-hd.mp4"
hero 540 960 "${MOBILE_CRF:-31}" "$OUT/play-mobile.mp4"
hero 360 640 "${COMPACT_CRF:-31}" "$OUT/play-compact.mp4"

loop 21.5 4.0 0.6 540 960 "${LOOP_CRF:-28}" "$OUT/loader.mp4"
loop 60.7 6.0 0.8 540 960 "${LOOP_CRF:-28}" "$OUT/ambient-group.mp4"
loop 72.0 7.0 0.8 540 960 "${LOOP_CRF:-28}" "$OUT/ambient-ridge.mp4"
loop 52.6 6.0 0.8 540 960 "${LOOP_CRF:-28}" "$OUT/ambient-gallop.mp4"

# Posters = frame 0 so the poster -> video swap is seamless.
still "$OUT/play-hd.mp4" "$OUT/poster-hd.webp" "gblur=sigma=0.6" 68
still "$OUT/play-mobile.mp4" "$OUT/poster-mobile.webp" "gblur=sigma=0.7" 65
# The loader still is only a backdrop for the first moments before its clip plays.
still "$OUT/loader.mp4" "$OUT/loader.webp" "scale=360:640:flags=lanczos,gblur=sigma=0.5" 62
still "$OUT/ambient-group.mp4" "$OUT/ambient-group.webp"
still "$OUT/ambient-ridge.mp4" "$OUT/ambient-ridge.webp"
still "$OUT/ambient-gallop.mp4" "$OUT/ambient-gallop.webp"

for f in "$OUT"/*.mp4; do
  printf '%-40s %8s B  %ss\n' "$f" "$(stat -c %s "$f")" \
    "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"
done
ls -l "$OUT"/*.webp
