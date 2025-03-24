-- global fadeDuration
global fadeStepDuration
set fadeDuration to 1 -- in seconds
set fadeStepDuration to 0.02 -- in seconds, Apple says this should be > 0.01667
set min to 20
set max to 60

tell application "Music" to set musicState to (player state as text)
tell application "Music" to set currentVolume to sound volume

if musicState is equal to "playing" then
  if currentVolume ≠ min and currentVolume ≠ max then
    tell application "Music"
      pause
      delay fadeDuration+0.1
      set sound volume to 0
    end tell
  else if currentVolume > min then
    fade(min, fadeDuration, fadeStepDuration)
  else if currentVolume < max then
    fade(max, fadeDuration, fadeStepDuration)
  end if
else
  tell application "Music" to play
  fade(max, fadeDuration, fadeStepDuration)
end if

on fade(target, fadeDuration, step)
  tell application "Music"
    set currentVolume to sound volume
    set fadeStepCount to fadeDuration / step
    set fadeStepSize to (currentVolume - target) / fadeStepCount
    set isNegative to false
    if fadeStepSize < 0 then
      set isNegative to true
      set fadeStepSize to fadeStepSize * -1
    end if

    repeat fadeStepCount times
      if isNegative then
        set currentVolume to currentVolume + fadeStepSize
      else
        set currentVolume to currentVolume - fadeStepSize
      end if
      set sound volume to currentVolume
      delay fadeStepDuration
    end repeat
  end tell
end fade