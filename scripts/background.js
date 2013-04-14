// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });



var DWC = {
  // ページに対するアクション(開く、マウスを動かすなど)から推定するページの視聴の最短時間
  MIN_SESSION_SECOND: 30
};


DWC.Tools = {
  // url文字列からドメインだけ返す
  url2domain: function(url){
    return url.match(/^\w+:\/{2,3}([0-9a-z\.\-:]+?):?[0-9]*?\//i)[1];
  },

  date2StartTime: function(_date){
    return new Date(_date.getFullYear(), _date.getMonth(), _date.getDate()).getTime() / 1000;
  },

  log: function(_data){
    console.log(_data)
  }
};


DWC.App = {
  //=== Application Entry Point.
  init: function(){
    console.log("DWC.App.init()");

    DWC.IndexedDB.init();

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      // console.log(tabId, changeInfo, tab);
      console.log(tab)
      this.onPageAction(tab);
    }.bind(this));

    chrome.tabs.onCreated.addListener(function(tabId, changeInfo, tab) {
      //console.log(tabId, changeInfo, tab);
      console.log(tab)
      this.onPageAction(tab);
    }.bind(this));


  },

  onPageAction: function(_tab){
    console.log(_tab);
    DWC.Watch.create({
      type: 'open',
      domain: DWC.Tools.url2domain(_tab.url),
      url: _tab.url,
      title: _tab.title,
      watch_start: new Date().getTime() / 1000,
      watch_end: new Date().getTime() / 1000 + DWC.MIN_SESSION_SECOND
    });
  }

}

DWC.Watch = {
  all: function(_fn){
    var db = DWC.IndexedDB.db;
    var trans = db.transaction(["watches"], "readwrite");
    var store = trans.objectStore("watches");

    // Get everything in the store;
    var cursorRequest = store.openCursor();

    cursorRequest.onsuccess = function(e) {
      var result = e.target.result;
      if(!!result == false){return}

      console.log(result.value);
      result.continue();
    };

    cursorRequest.onerror = html5rocks.indexedDB.onerror;
  },
  getById: function(id){},
  getByDate: function(_date, _callback){
    console.log("DWC.Watch.getByDate");

    var db = DWC.IndexedDB.db;
    var trans = db.transaction(["watches"], "readonly");
    var store = trans.objectStore("watches");

    // cursorで検索
    var index = store.index("watch_start");
    var boundKeyRange = IDBKeyRange.bound(DWC.Tools.date2StartTime(_date), DWC.Tools.date2StartTime(_date) + 24*60*60, false, true);

    var _data_list = [];
    index.openCursor(boundKeyRange).onsuccess = function(_e) {
      var cursor = _e.target.result;
      if (cursor) {
        _data_list.push(cursor.value)
        cursor.continue();
      }else{
        console.log("cursor.end");

        _callback(this.convertStoreObject2List(_data_list));
      }
    }.bind(this);
  },
  getByToday: function(_callback){
    this.getByDate(new Date, _callback)
  },
  convertStoreObject2List: function(_data){
    var _hash = {}
    var _total_elapsed = 0;
    _data.forEach(function(_item){
      _hash[_item.domain] = _hash[_item.domain] || 0;
      var _elapsed = _item.watch_end - _item.watch_start;
      _total_elapsed += _elapsed;
      _hash[_item.domain] += _elapsed;
    });
    var _elapse_list = [];
    for(_domain in _hash){
      // _elapse_list.push([_domain, (_hash[_domain] / _total_elapsed).toFixed(2) - 0])
      _elapse_list.push([_domain, _hash[_domain]])
    }
    return _elapse_list;
  },
  create: function(_data){
    var db = DWC.IndexedDB.db;
    var trans = db.transaction(["watches"], "readwrite");
    var store = trans.objectStore("watches");
    var request = store.put(_data);

    request.onsuccess = function(e) {
      console.log("DWC.Watch.create success: %o", e);
    };

    request.onerror = function(e) {
      console.log("DWC.Watch.create error: %o", e);
    };
  }
};


DWC.IndexedDB = {

  DB_NAME: "watches",
  STORE_NAME: "watches",
  db: null,

  init: function(){
    window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
    if ('webkitIndexedDB' in window) {
      window.IDBTransaction = window.webkitIDBTransaction;
      window.IDBKeyRange = window.webkitIDBKeyRange;
    }

    this.open();
  },

  open: function() {
    var version = 4;
    var request = indexedDB.open(this.DB_NAME, version);

    request.onupgradeneeded = function(_e) {
      var db = _e.target.result;
      console.log("DWC.IndexedDB.open.onupgradeneeded");


      // TODO: Implement Migration
      // if(db.objectStoreNames.contains("watches")) {
      //   db.deleteObjectStore("watches");
      // }

      var store = db.createObjectStore(
        this.STORE_NAME, { keyPath: 'id', autoIncrement: true });

      store.createIndex('domain', 'domain', { unique: false });
      store.createIndex('watch_start', 'watch_start', { unique: false });

    }.bind(this);

    request.onsuccess = function(_e) {
      this.db = _e.target.result;
      console.log("DWC.IndexedDB.open successed");
    }.bind(this);

    request.onerror = this.onError;
  },

  onError: function(e) {
    console.error("There has been an error: " + e.message);
  },


};


DWC.App.init();


