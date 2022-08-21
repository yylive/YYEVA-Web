import {useState, useRef, useEffect, useCallback} from 'react'
import {yyEva, YYEvaOptionsType} from 'yyeva'
import {Button, Drawer, Radio, Space, Select, Form} from 'antd'
import {modeList, phoneList} from './preview-config'
import PreviewDesc from './PreviewDesc'
import PreviewExtendForm from './PreviewExtendForm'
import demoUrl from './dataUrl'
import './preview.scss'
import 'antd/dist/antd.css'

import type {DrawerProps, RadioChangeEvent} from 'antd'

const {Option} = Select

const PlayGround = () => {
  const [form] = Form.useForm()
  const [ctrlBarVisible, setCtrlBarVisible] = useState(false)
  const onClose = () => {
    setCtrlBarVisible(false)
  }
  const showDrawer = () => {
    setCtrlBarVisible(true)
  }
  const [extendFormVisible, setExtendFormVisible] = useState(false)
  const onExtendFormClose = () => {
    setExtendFormVisible(false)
  }
  const openExtendForm = () => {
    setExtendFormVisible(true)
  }
  const onPhoneListChange = (value: string) => {
    console.log('onChange', value)
    setDropInfo({
      objdata: phoneList[value],
      dropWidth: phoneList[value].width + 'px',
      dropHeight: phoneList[value].height + 'px',
      dropBackground: phoneList[value].background,
      dropBorder: phoneList[value].border,
      routeSupport: phoneList[value].routeSupport,
      outsideBackground: phoneList[value].outsideBackground,
    })
  }
  const [dropInfo, setDropInfo] = useState({
    objdata: phoneList['iPhone 6'],
    dropWidth: phoneList['iPhone 6'].width + 'px',
    dropHeight: phoneList['iPhone 6'].height + 'px',
    dropBackground: phoneList['iPhone 6'].background,
    dropBorder: phoneList['iPhone 6'].border,
    routeSupport: phoneList['iPhone 6'].routeSupport,
    outsideBackground: {
      width: 0,
      height: 0,
      background: '',
      left: 0,
      bottom: 0,
    },
  })
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const descRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const modeOptionRef = useRef<YYEvaOptionsType['mode']>('vertical')
  const cacheDataRef = useRef<any>({})
  const evideoRef = useRef<any>(null)
  const getExtension = (filename: string) => {
    return filename.substring(filename.lastIndexOf('.'))
  }

  const demoPreview = () => {
    cacheDataRef.current.effects = {
      // souceimage: 'https://unpkg.yy.com/webupload/e-video/demo/a1.png',
      // comicimage: 'https://unpkg.yy.com/webupload/e-video/demo/b1.png',
      // mp4url: 'https://unpkg.yy.com/webupload/e-video/demo/AAA_dynamic_264_mid-0.mp4',
      mp4url: demoUrl,
    }
    if (dropZoneRef.current) {
      replayMp4(cacheDataRef.current.effects.mp4url, dropZoneRef.current, () => {
        if (dropZoneRef.current && descRef.current) {
          descRef.current.style.display = 'none'
          dropZoneRef.current.classList.add('playerbackground')
        }
      })
    }
  }
  /**
   * 生成 effect 扩展表单
   * @param {*} evideo
   */
  const showExtendForm = (evideo: any) => {
    const extendConfig = evideo?.renderer?.videoEntity?.config
    if (extendConfig) {
      const extend_form = document.querySelector('#extend_form')
      const descript_show = document.querySelector('#descript_show')
      const datas_show = document.querySelector('#datas_show')
      const effect_show = document.querySelector('#effect_show')
      try {
        if (extend_form && descript_show && datas_show && effect_show) {
          ;(extend_form as any).style.display = 'block'
          ;(descript_show as any).value = JSON.stringify(extendConfig.descript, null, 2)
          ;(datas_show as any).value = JSON.stringify(extendConfig.datas, null, 2)
          ;(effect_show as any).value = JSON.stringify(extendConfig.effect, null, 2)
        }
      } catch (e) {
        console.error(`evideo.renderer.videoEntity.config parse error`, e)
      }
      // 生成表单
      if (Array.isArray(extendConfig.effect) && extendConfig.effect.length > 0) {
        const effect_block = document.querySelector('#effect_block')
        ;(effect_block as any).innerHTML = ''
        extendConfig.effect.forEach((item: any) => {
          const inputEl = document.createElement('input')
          inputEl.setAttribute('effect_tag', item.effectTag)
          inputEl.classList.add('effect_input')
          if (item.effectType === 'img') {
            inputEl.type = 'file'
            inputEl.accept = 'image/png, image/jpeg'
            ;(effect_block as any).append(item.effectTag + ':')
            ;(effect_block as any).appendChild(inputEl)
            inputEl.addEventListener('change', function (e) {
              // console.log(`inputEl.onchange`, e, inputEl.files)
              if (inputEl.files && inputEl.files[0]) {
                const reader = new FileReader()
                reader.readAsDataURL(inputEl.files[0])
                reader.onloadend = function (e) {
                  if (!cacheDataRef.current.effects) {
                    cacheDataRef.current.effects = {}
                  }
                  cacheDataRef.current.effects[inputEl.getAttribute('effect_tag') || ''] = reader.result
                }
              }
            })
          } else if (item.effectType === 'txt') {
            inputEl.type = 'text'
            ;(effect_block as any).append(item.effectTag + ':')
            ;(effect_block as any).appendChild(inputEl)
            inputEl.addEventListener('change', function (e) {
              // console.log(`on change`, this.value)
              if (!cacheDataRef.current.effects) {
                cacheDataRef.current.effects = {}
              }
              cacheDataRef.current.effects[inputEl.getAttribute('effect_tag') || ''] = this.value
            })
          }
        })
      }
    }
  }
  const replayMp4 = async (videoUrl?: string | ArrayBuffer, divcurrent?: HTMLElement, cb?: any) => {
    if (videoUrl) {
      cacheDataRef.current.videoUrl = videoUrl
    }
    if (divcurrent) {
      cacheDataRef.current.divcurrent = divcurrent
    }
    //   console.log(`replayMp4`, cacheData, modeOption)
    if (evideoRef.current) {
      evideoRef.current.destroy()
    }
    if (!cacheDataRef.current.divcurrent) {
      return
    }
    cb && cb()

    evideoRef.current = await yyEva({
      videoUrl: cacheDataRef.current.videoUrl,
      useMetaData: true,
      loop: true,
      mode: modeOptionRef.current,
      effects: cacheDataRef.current.effects,
      alphaDirection: 'right',
      container: cacheDataRef.current.divcurrent,
      // useFrameCache: false,
    })
    await evideoRef.current.setup()
    evideoRef.current.start()
    showExtendForm(evideoRef.current)
  }
  const setModeOption = useCallback((mode: YYEvaOptionsType['mode']) => {
    modeOptionRef.current = mode
    replayMp4()
  }, [])

  useEffect(() => {
    if (dropZoneRef.current && descRef.current) {
      const dropzone = dropZoneRef.current
      // 此事件是必须的，且要阻止默认事件
      dropzone.addEventListener(
        'dragover',
        function (event) {
          event.preventDefault()
        },
        false,
      )

      // 拖拽结束时触发
      dropzone.addEventListener(
        'drop',
        function (event) {
          event.preventDefault()
          // 拖拽（转移）的对象列表
          if (!event.dataTransfer) {
            return
          }
          const reader = new FileReader()
          const aimfile = event.dataTransfer.files[0]
          if (getExtension(aimfile.name) === '.mp4') {
            reader.readAsDataURL(aimfile)
            reader.onloadend = function (e) {
              cacheDataRef.current = {}
              if (dropZoneRef.current && descRef.current) {
                replayMp4(reader?.result || '', dropZoneRef.current, () => {
                  if (dropZoneRef.current && descRef.current) {
                    descRef.current.style.display = 'none'
                    dropZoneRef.current.classList.add('playerbackground')
                  }
                })
              }
            }
          }
        },
        false,
      )
    }

    if (inputRef.current) {
      inputRef.current.addEventListener('change', function (event) {
        const reader = new FileReader()
        const aimfile = inputRef?.current?.files?.[0]
        if (aimfile && getExtension(aimfile.name) === '.mp4') {
          reader.readAsDataURL(aimfile)
          reader.onloadend = function (e) {
            cacheDataRef.current = {}
            if (dropZoneRef.current && descRef.current) {
              replayMp4(reader.result || '', dropZoneRef.current, () => {
                if (dropZoneRef.current && descRef.current) {
                  descRef.current.style.display = 'none'
                  dropZoneRef.current.classList.add('playerbackground')
                }
              })
            }
          }
        }
      })
    }
  }, [])

  useEffect(() => {
    replayMp4()
  }, [dropInfo.dropWidth, dropInfo.dropHeight])

  return (
    <div className="preview_wrap">
      <div className="MainLayoutStyle">
        <div className="TopBarDescFont">
          <input
            style={{display: 'none'}}
            id="drop_width_dom"
            type="number"
            onChange={e => {
              if (Number(e.target.value) >= 150) {
                setDropInfo({
                  ...dropInfo,
                  dropWidth: e.target.value + 'px',
                })
              }
            }}
            value={dropInfo.dropWidth ? dropInfo.dropWidth.replace('px', '') : ''}
          />
          <input
            style={{display: 'none'}}
            id="drop_height_dom"
            type="number"
            onChange={e => {
              if (Number(e.target.value) >= 150) {
                setDropInfo({
                  ...dropInfo,
                  dropHeight: e.target.value + 'px',
                })
              }
            }}
            value={dropInfo.dropHeight ? dropInfo.dropHeight.replace('px', '') : ''}
          />
        </div>
        <div
          ref={dropZoneRef}
          className="MainWrapStyle"
          draggable="true"
          style={{
            width: dropInfo.dropWidth,
            height: dropInfo.dropHeight,
            background: `url(${dropInfo.dropBackground}) 0% 0% / cover`,
          }}
        >
          <div
            className="OutSideBackground"
            style={{
              width: dropInfo?.outsideBackground?.width,
              height: dropInfo?.outsideBackground?.height,
              backgroundImage: `url(${dropInfo?.outsideBackground?.background})`,
              left: `${dropInfo?.outsideBackground?.left}px`,
              bottom: `${dropInfo?.outsideBackground?.bottom}px`,
            }}
          ></div>
          <div ref={descRef} className="MainWrapDesc">
            <PreviewDesc />
          </div>
          <div
            className="MainWrapBorder"
            style={{
              background: `url(${dropInfo.dropBorder?.src})  0% 0% / cover`,
              top: `${dropInfo.dropBorder?.top}px`,
              left: `${dropInfo.dropBorder?.left}px`,
              width: `${dropInfo.dropBorder?.width}px`,
              height: `${dropInfo.dropBorder?.height}px`,
              transform:
                Number(dropInfo.dropWidth?.replace('px', '')) > Number(dropInfo.dropHeight?.replace('px', ''))
                  ? dropInfo.dropBorder?.transform
                  : '',
            }}
          ></div>
        </div>
      </div>
      <Button type="primary" onClick={showDrawer} className="setting_button">
        设置
      </Button>
      <Button type="primary" onClick={openExtendForm} className="extend_button">
        扩展key
      </Button>
      <Drawer title="预览设置" placement={'top'} closable={false} onClose={onClose} visible={ctrlBarVisible}>
        <div className="buttonWrap">
          <div className="uploadButton">
            <input ref={inputRef} className="uploadInput" type="file" />
            选择文件
          </div>
          <div onClick={demoPreview} className="demoButton">
            预览Demo
          </div>
        </div>
        <Form form={form}>
          <Form.Item label="选择模拟设备">
            <Select defaultValue={Object.keys(phoneList)?.[0]} style={{width: 220}} onChange={onPhoneListChange}>
              {Object.keys(phoneList).map(item => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="选择填充模式" name="fillmodeselect">
            <Select
              style={{width: 220}}
              defaultValue={modeList[0]}
              onChange={(value: string) => {
                console.log('onChange', value)
                setModeOption(value as YYEvaOptionsType['mode'])
              }}
            >
              {modeList.map(item => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Button
            onClick={() => {
              const tempHeight = (document?.querySelector('#drop_height_dom') as any)?.value
              const tempWidth = (document?.querySelector('#drop_width_dom') as any)?.value
              setDropInfo({
                ...dropInfo,
                dropWidth: tempHeight + 'px',
                dropHeight: tempWidth + 'px',
                dropBackground: tempHeight > tempWidth ? dropInfo.objdata.backgroundH : dropInfo.objdata.background,
              })
              if (tempWidth < tempHeight) {
                setModeOption('horizontal')
                form.setFieldsValue({
                  fillmodeselect: 'horizontal',
                })
              } else {
                setModeOption('vertical')
                form.setFieldsValue({
                  fillmodeselect: 'vertical',
                })
              }
            }}
          >
            旋转屏幕
          </Button>
        </Form>
      </Drawer>
      <Drawer
        title="mp4扩展信息"
        placement={'top'}
        closable={false}
        onClose={onExtendFormClose}
        visible={extendFormVisible}
      >
        <PreviewExtendForm replayMp4={replayMp4} />
      </Drawer>
    </div>
  )
}

export default PlayGround
