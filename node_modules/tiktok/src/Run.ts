export interface IPromise {
  then(resolve:TCallback):IPromise
  catch(resolve:TCallback):IPromise
}
export type TRun = (...args:any[]) => Promise<{[name:string]:any}>
export type TCallback = (...args:any[]) => void

export class Run implements IPromise{
  protected _runningFlag?:boolean
  private _myList:Promise<any>[]
  private _then?:TCallback
  private _catch?:TCallback

  constructor(list:TRun[], ...args:any[]){
    this._myList = this._getRunners(list, ...args)
    this._runningFlag = false
  }

  then(resolve:TCallback):IPromise{
    if(!this._then){
      this._then = resolve
    }
    return this
  }

  catch(resolve:TCallback):IPromise{
    if(!this._catch){
      this._catch = resolve
    }
    return this
  }

  start(){
    this._start()
  }

  protected _getRunners(list:TRun[], ...args:any[]){
    return list.map((item:TRun) => {
      return item(...args)
    })
  }

  protected _resolve(result:any){
    const {_then} = this
    if(typeof _then === 'function'){
      _then(result)
    }
  }

  protected _reject(error:any){
    const {_catch} = this
    if(typeof _catch === 'function'){
      _catch(error)
    }
  }

  protected _ableToStart(){
    if(this._list.length < 1){
      this._runningFlag = false
      return false
    }
    this._runningFlag = true
    return true
  }

  protected _done(){
    this._runningFlag = false
  }

  protected _start(){
    if(!this._ableToStart()){return}
    Promise.all(this._list).then((result:any) => {
      this._done()
      this._resolve(result)
    }).catch((error:any) => {
      this._done()
      this._reject(error)
    })
  }

  protected get _list():Promise<any>[]{
    return this._myList
  }

  protected set _list(list:Promise<any>[]){
    this._myList = list
  }
}
