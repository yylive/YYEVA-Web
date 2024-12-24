import {logger} from 'src/helper/logger'

type VideoEntity = any
class DB {
  private readonly storeName: string
  private readonly dbPromise: Promise<IDBDatabase>
  constructor(
    {
      name,
      version,
      storeName,
    }: {
      name: string
      version: number //版本号要比老版本高 否则会报错
      storeName: string
    } = {name: 'e-video', version: 1, storeName: 'video'},
  ) {
    logger.debug('[DBCache] DB', name, version, storeName)
    this.storeName = storeName
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (self.indexedDB !== undefined) {
        const request = self.indexedDB.open(name, version)
        // request.onerror = error => reject(new Error(`IndexedDB open fail, ${error.type}`))
        // request.onerror = error => reject(`IndexedDB open fail, ${error.type}`)
        request.onerror = error => {
          // 在保证实例化一次的情况下不报错 可继续送礼
          logger.warn(`IndexedDB open fail, ${error.type}`)
          return resolve(undefined)
        }
        request.onsuccess = () => resolve(request.result)
        request.onupgradeneeded = e => {
          const db = request.result
          if (e.oldVersion && e.oldVersion < e.newVersion) {
            logger.debug('[DB] deleteObjectStore')
            db.deleteObjectStore(storeName)
          }
          db.createObjectStore(storeName)
        }
      } else {
        reject('IndexedDB not supported')
      }
    })
  }

  async find(id: IDBValidKey): Promise<VideoEntity | undefined> {
    return await this.dbPromise.then(
      async db =>
        await new Promise((resolve, reject) => {
          const tx = db.transaction([this.storeName], 'readonly')
          const request = tx.objectStore(this.storeName).get(id)
          request.onsuccess = () => {
            /* if (typeof request.result === 'string') {
              resolve(this.stringToMovie(request.result))
            } else {
              resolve(undefined)
            } */
            resolve(request.result)
          }
          request.onerror = () => reject(new Error('Find Error'))
        }),
    )
  }
  // stringToMovie(m: string) {
  //   return JSON.parse(m)
  // }
  // moiveToString(m: VideoEntity) {
  //   return JSON.stringify(m)
  // }
  async insert(id: IDBValidKey, data: VideoEntity): Promise<void> {
    // const d = this.moiveToString(data)
    return await this.dbPromise.then(
      async db =>
        await new Promise((resolve, reject) => {
          const tx = db.transaction([this.storeName], 'readwrite')
          const request = tx.objectStore(this.storeName).put(data, id)
          tx.oncomplete = () => resolve()
          request.onerror = () => reject(new Error('Insert Error'))
        }),
    )
  }

  async delete(id: IDBValidKey): Promise<void> {
    return await this.dbPromise.then(
      async db =>
        await new Promise((resolve, reject) => {
          const tx = db.transaction([this.storeName], 'readwrite')
          const request = tx.objectStore(this.storeName).delete(id)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(new Error('Delete Error'))
        }),
    )
  }
}
/**
 * 适配多浏览器兼容性、SSR方案
 * DBCache
 *  options 必须
 *  usePrefetch: true,
    useVideoDBCache: true,
		使用方式：
		import db from 'src/parser/db'
		db.IndexDB = true
		db.model().find
		db.model().insert
		db.model().delete
 */
class DBCache {
  private useIndexDB = true
  private db?: DB
  constructor() {
    // logger.debug('[DBCache] constructor')
  }
  set IndexDB(isUse: boolean) {
    this.useIndexDB = isUse
    // logger.debug('[DBCache] IndexDB', this.useIndexDB)
  }
  model() {
    // logger.debug('[DBCache] model', this.useIndexDB)
    if (typeof window !== 'undefined' && this.useIndexDB) {
      if (!this.db) {
        logger.debug('[DBCache] new DB')
        this.db = new DB()
      }
      return this.db
    } else {
      return this
    }
  }
  async find(id: IDBValidKey) {}
  async insert(id: IDBValidKey, data: VideoEntity) {}
  async delete(id: IDBValidKey) {}
}
// export {DBCache}
export default new DBCache()
// export default typeof window !== 'undefined' ? new DB() : ({} as DB)
