import {IPromise, Run, TRun} from './Run'
export interface IStep extends IPromise{
  delay(time:number):void
  add(runner:TRun, ...args:any[]):void
  addAll(runners:TRun[], ...args:any[]):void
}
export class Step extends Run implements IStep{
  private _delay
  private _nextList
  constructor(list?:TRun[], ...args:any[]){
    super(typeof list !== 'undefined' ? list : [], ...args)
    this._delay = 0
    this._nextList = []
  }

  delay(time:number):void{
    this._delay = time
  }

  add(runner:TRun, ...args:any[]):void{
    this.addAll([runner], ...args)
  }

  addAll(runners:TRun[], ...args:any[]):void{
    const list = this._getRunners(runners, ...args)
    if(this._runningFlag){
      this._nextList.push(list)
    }else{
      this._list = list
      this.start()
    }
  }

  protected _done(){
    super._done()
    this._list = []
  }

  protected _start(){
    if(!this._ableToStart()){return}
    Promise.all(this._list).then((result:any) => {
      setTimeout(() => {
        this._resolve(result)
        if(this._nextList.length < 1){
          this._done()
          return
        }
        this._list = this._nextList.pop()
        this._start()
      }, this._delay)
    }).catch((error:any) => {
      this._done()
      this._reject(error)
    })
  }
}
