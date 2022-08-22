import {useEffect, useRef, useState} from 'react'
const host = ''
export const usePlayer = () => {
  const [videos, setVideos] = useState([
    {
      videoUrl: `${host}/yy/m64.mp4`,
      effects: {
        a1: '/yy/a1.png',
        a2: '/yy/b1.png',
      },
    },
    {
      videoUrl: `${host}/yy/music.mp4`,
    },
    {
      videoUrl: `${host}/yy/yy.mp4`,

      effects: {
        user_nick: 'girl',
        user_avatar: '/yy/1.jpeg',
        anchor_nick: 'boy',
        anchor_avatar: '/yy/2.jpeg',
      },
    },
  ])
  const [options, setOptions] = useState({
    alphaDirection: 'right',
    mode: 'AspectFill',
    useMetaData: true,
    loop: false,
    useFrameCache: true,
    mute: true,
  })
  return {videos, setVideos, options, setOptions}
}
