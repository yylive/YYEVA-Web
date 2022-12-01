const host = ''
const selected: any = {
  default: {
    /*  videoUrl: `${host}/yy/yy.mp4`,
    effects: {
      user_nick: 'girl',
      user_avatar: '/yy/1.jpeg',
      anchor_nick: 'boy',
      anchor_avatar: '/yy/2.jpeg',
    }, */
    videoUrl: `${host}/yy/pld_264.mp4`,
    effects: {
      souceimage: '/yy/b6.png',
      comicimage: '/yy/b6c.png',
      key: 'YYEVA',
    }, 
  /*   videoUrl: `${host}/yy/pld_264_crf12.mp4`,
    effects: {
      1: '/yy/b6.png',
      2: '/yy/b6c.png',
      key: 'YYEVA',
    }, */
    mode: 'Fill',
  },
  music: {
    videoUrl: `${host}/yy/music.mp4`,
    effects: {
      'keyname.png': 'music video',
      key: '/yy/q1.jpeg',
    },
    mute: false,
    mode: 'Fill',
  },
  aspectFill: {
    videoUrl: `${host}/yy/aspectFill.mp4`,
    mode: 'AspectFill',
  },
  aspectFit: {
    videoUrl: `${host}/yy/aspectFit.mp4`,
    mode: 'AspectFit',
  },
  hevc: {
    videoUrl: `${host}/yy/fh-264.mp4`,
    hevcUrl: `${host}/yy/fh-265.mp4`,
    effects: {
      anchor_nick: `凤凰坐骑进场秀`,
    },
  },
}
export default selected
