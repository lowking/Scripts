property FavoritePlaylist: "腻了的"
tell application "Music"
  set thePlaylist to user playlist FavoritePlaylist
  set trackName to name of current track
  set artistName to artist of current track
  set dbid to database ID of current track
  set hasDoNext to false
  repeat with aPlaylist in (get every playlist)
    set playlistName to name of aPlaylist
    repeat 1 times -- 这个repeat为了下面的exit repeat，实现循环的continue
      if {"资料库", "音乐", "音源问题", "33号远征队", "泪目", "腻了的"} contains playlistName then -- list中的资料库，音乐，音源问题（这个是我自己用来记录的）跳过
        exit repeat
      end if
      set foundTracks to (every track of aPlaylist whose artist is artistName and name is trackName)
      repeat with theTrack in foundTracks
        log trackName & " " & playlistName
        next track
        set hasDoNext to true
        if not exists (some track of playlist FavoritePlaylist whose database ID is dbid) then duplicate theTrack to thePlaylist
        tell thePlaylist to delete contents of theTrack
      end repeat
    end repeat
  end repeat
  if not hasDoNext then next track
end tell