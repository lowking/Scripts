property FavoritePlaylist: "好听"
tell application "Music"
  set thePlaylist to user playlist FavoritePlaylist

  set trackName to name of current track
  set artistName to artist of current track
  set dbid to database ID of current track
  set trackRating to rating of current track
  set trackPlayedCount to played count of current track
  try
    duplicate current track to source "Library" -- Add track from Apple Music to local library
  end try

  delay 4 -- Allow time for track to be registered with the local Library

  (* Copy track to playlist *)
  set foundTracks to (every track of library playlist 1 whose artist is artistName and name is trackName)
  repeat with theTrack in foundTracks
    -- setting rating
    if trackRating < 80
      set rating of theTrack to 80
    else if trackPlayedCount > 40 -- played times > 40, give 5 stars
      set rating of theTrack to 100
    end if
    if exists (some track of playlist FavoritePlaylist whose database ID is dbid) then return
    duplicate theTrack to thePlaylist
  end repeat
end tell