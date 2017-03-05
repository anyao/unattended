angular.module('starter.services', [])
.factory('ProdInfos', function() {
  return {
    ver: function() {
      return "1.0.0.0";
    },
    publishat: function() {
      return "2017-02-18";
    }
  }
})

.factory('UserInfos', function() {
  var userinfos = {};
  var whses = {};
  var isnetconnect = false;
  var localurl = "http://172.20.32.80/";
  var remoteurl = "http://222.222.237.148:12346/";
  // var remoteurl = "http://172.20.32.80/";
  return {
    all: function() {
      return userinfos;
    },
    geturl: function() {
        var url = "";
        if (isnetconnect)
            url = localurl;
        else
            url = remoteurl;
        return url + "wapsvr/helper.php?callback=JSON_CALLBACK";
    },
    getrooturl: function() {
        if (isnetconnect)
            return localurl;
        else
            return remoteurl;
    },
    clear: function() {
      userinfos = {};
    },
    set: function(data) {
        for (var k in data) {
          userinfos[k] = data[k];
        }
    },
    setkey: function(key, val) {
        userinfos[key] = val;
    },
    setcontp: function(b) {
        isnetconnect = b;
    },
    getcontp: function() {
        return isnetconnect;
    },
    get: function(key) {
      if (typeof userinfos[key] == "undefined")
          return null;
      return userinfos[key];
    }
  }
})

.factory('WhseInfos', function($ionicLoading, $q, $http, UserInfos){
  var cacheinfos = {};
  var whseitems = {};
  var orgitems = [];
  var parse_data = function(arr) {
    for (var i = 0; i < arr.length; i++){
        var ai = arr[i];
        if (typeof whseitems[ai.orgid] == "undefined") {
            whseitems[ai.orgid] = {orgid: ai.orgid, orgname: ai.orgname, son: [{whseid: ai.whseid, whsename: ai.whsename, pk_corp: ai.pk_corp}]};
            orgitems.push({orgid: ai.orgid, orgname: ai.orgname});
        }else
            whseitems[ai.orgid].son.push({whseid: ai.whseid, whsename: ai.whsename, pk_corp: ai.pk_corp});
    } 
  }

  return {
    listitems: function(){
       var deferred = $q.defer();
       $http.jsonp(UserInfos.geturl(), {params: {userid: UserInfos.get("userid"), option: 'whseslist', sid: UserInfos.get("sessionid")}, timeout: 5000})
         .success(function(resp, status, headers, config) {
            if (resp.errmsg != "") {
                deferred.reject();
                $ionicLoading.show({ template: '错误：' + resp.errmsg, noBackdrop: true });
            }else {
                parse_data(resp.whses);
                deferred.resolve(); 
            }
         })
         .error(function() {
            deferred.reject();
           $ionicLoading.show({ template: '仓库信息获取错误，你可以稍候重试'+resp.errmsg, duration: 10000, noBackdrop: true });
         });
       return deferred.promise;
    },
    set: function(key,val){
      cacheinfos[key] = val;
    },
    get: function(key){
      if (typeof cacheinfos[key] == "undefined")
          return null;
      return cacheinfos[key];
    },
    allowwhse: function(whseid) {
        for (var k in whseitems) {
            for (var i=0;i<whseitems[k].son.length;i++) {
                if (whseitems[k].son[i].whseid == whseid)
                    return true;
            }
        }
        return false;
    },
    alloworg: function(orgid) {
        return (typeof whseitems[orgid] != "undefined");
    },
    getwhses: function(orgid) {
        if (typeof whseitems[orgid] == "undefined")
            return null;
        return whseitems[orgid].son;
    },
    getorgs: function() {
        return orgitems;
    },
    getitems: function() {
        return whseitems;
    }
  } 
})

.factory('nfcService', function ($rootScope, $ionicPlatform, $http, $ionicPopup, $ionicLoading, UserInfos,$location, $ionicActionSheet) {
    var zjtag = {errmsg: "", succmsg: "请刷卡..."};
    var shqrtag = {errmsg: "", succmsg: "请刷卡..."};
    var cardtag = {errmsg: "", succmsg: "请刷卡..."};
    var lastCard = "";  
    var listener_callback = function(evt) {
        var _path = $location.path();
        switch (_path){
          case '/tab/zjlr':
            var para = {userid: UserInfos.get("userid"), option: 'scaleinfo', sid: UserInfos.get("sessionid"), cardno: "", action: "zjlr"};
            break;
          case '/tab/shqr':
            var para = {userid: UserInfos.get("userid"), option: 'scaleinfo', sid: UserInfos.get("sessionid"), cardno: "", action: "shqr"};
            break;
          case '/tab/kphs':
            var para = {userid: UserInfos.get("userid"), option: 'scaleinfo', sid: UserInfos.get("sessionid"), cardno: "", action: "kphs"};
            break;
          default:
            return;
        }

        // nfc获取卡号
        para.cardno = nfc.bytesToHexString(evt.tag.id);
        if (_path + para.cardno == lastCard) 
          return;
        lastCard = _path + para.cardno;
        // 用卡号查询后台数据
        $http.jsonp(UserInfos.geturl(), {params: para, timeout: 5000})
          .success(function(res) {
               if (res.errmsg != "") {
                 if (res.errmsg == "tologin")
                   $location.path('/login').replace();
                 else
                   if($location.path() == "/tab/zjlr")
                    angular.copy({errmsg: res.errmsg, succmsg: ""}, zjtag);
                   else if(_path == "/tab/shqr")
                    angular.copy({errmsg: res.errmsg, succmsg: ""}, shqrtag);
                   else
                    angular.copy({errmsg: res.errmsg, succmsg: ""}, cardtag);
               }else {
                 var data = res.data;
                 var len = res.data.length;
                 if (len == 1) {
                   if($location.path() == "/tab/zjlr") {
                    angular.copy(data[0], zjtag);
                    zjtag.succmsg = "读卡成功";
                   }else if(_path == "/tab/shqr"){
                    angular.copy(data[0], shqrtag);
                    shqrtag.succmsg = "读卡成功";
                   }else{
                    angular.copy(data[0], cardtag);
                    cardtag.succmsg = "读卡成功";
                   }
                 } else {
                   // 卡号不唯一
                   var showText = new Array();
                   for (var i = 0; i < data.length; i++) {
                     showText[i] = {text: data[i].hphm + " " + data[i].invname};
                   }
                   $ionicActionSheet.show({
                    buttons: showText,
                    titleText: '请选择对应车辆',
                    cancelText: '取消',
                    buttonClicked: function(i) {
                      lastCard = "";
                      if($location.path() == "/tab/zjlr"){
                        angular.copy(data[i], zjtag);
                        zjtag.succmsg = "读卡成功";
                      }else if(_path == "/tab/shqr"){
                        angular.copy(data[i], shqrtag);
                        shqrtag.succmsg = "读卡成功";
                      }else{
                        angular.copy(data[i], cardtag);
                        cardtag.succmsg = "读卡成功";
                      }
                      return true;
                    },
                    cancel: function(){
                      lastCard = "";
                      return true;
                    }
                   });
                 }
               }
          })
          .error(function() {
            $ionicLoading.show({ template: '错误：网络错误,请稍候重试!', noBackdrop: true, duration: 3000 });
          });
    }

    $ionicPlatform.ready(function() {
      var isAndroid = ionic.Platform.isAndroid();
      if (isAndroid) {
          nfc.addTagDiscoveredListener(listener_callback, function () {
            zjtag.succmsg = "请刷卡...";
            shqrtag.succmsg = "请刷卡...";
          }, function (reason) {
            if (reason == "NFC_DISABLED")
                reason = "不支持 NFC 或 NFC 未开启";
            zjtag.errmsg = "读卡错误：" + reason;
            shqrtag.errmsg = "读卡错误：" + reason;
            catdtage.errmsg = "读卡错误：" + reason;
          }); 
      }
      else{
        zjtag.errmsg = "无法启动刷卡";
        zjtag.succmsg = "";
        shqrtag.errmsg = "无法启动刷卡";
        shqrtag.succmsg = "";
        cardtag.errmsg = "无法启动刷卡";
        cardtag.succmsg = "";
      }
    });

    return {
        zjtag: zjtag,
        shqrtag: shqrtag,
        cardtag: cardtag,
        clearZjTag: function () {
          angular.copy({errmsg: "", succmsg: "请刷卡..."}, this.zjtag);
          lastCard = "";
        },
        clearShqrTag: function() {
          angular.copy({errmsg: "", succmsg: "请刷卡..."}, this.shqrtag);
          lastCard = "";
        },
        clearCardTag: function() {
          angular.copy({errmsg: "", succmsg: "请刷卡..."}, this.cardtag);
          lastCard = "";
        }
    };
})

.factory('ZjHisItems', function($http, $q, $ionicLoading, UserInfos) {
  var hisitems = [];
  var lastid = 0;
  var hasmore = true;
  return {
    listitems: function() {
      var deferred = $q.defer();
      $http.jsonp(UserInfos.geturl(), {params: {userid: UserInfos.get("userid"), iid: lastid, option: 'zjhis', sid: UserInfos.get("sessionid")}, timeout: 5000})
        .success(function(resp, status, headers, config) {
          deferred.resolve(resp); 
        })
        .error(function() {
          deferred.reject();
          $ionicLoading.hide();
          $ionicLoading.show({ template: '网络错误，你可以稍候重试!', duration: 1000, noBackdrop: true });
        });
      return deferred.promise;
    },
    setitems: function(items) {
        for (var i=0;i<items.length;i++) {
            var dict = {};
            for (var k in items[i]) {
                dict[k] = items[i][k];
            }
            hisitems.push(dict);
        }
    }, 
    clearitems: function() {
        hisitems.length = 0;
    },
    getitems: function() {
        return hisitems;
    },
    getlastid: function() {
        return lastid;
    },
    setlastid: function(id) {
        lastid = id;
    },
    gethasmore: function() {
        return hasmore;
    },
    sethasmore: function(b) {
        hasmore = b;
    }
  }
})

.factory('ZJSmpItems', function($http, $q, $ionicLoading, UserInfos) {
  var smpitems = [];
  return {
    listitems: function() {
      var deferred = $q.defer();
      $http.jsonp(UserInfos.geturl(), {params: {userid: UserInfos.get("userid"), option: 'op4qy', sid: UserInfos.get("sessionid")}, timeout: 5000})
        .success(function(resp, status, headers, config) {
          deferred.resolve(resp); 
        })
        .error(function(data) {
          deferred.reject();
          $ionicLoading.hide();
          $ionicLoading.show({ template: '网络错误，你可以稍候重试!', duration: 1000, noBackdrop: true });
        });
      return deferred.promise;
    },
    setitems: function(items) {
      angular.copy(items, smpitems);
    }, 
    clearitems: function() {
      smpitems.length = 0;
    },
    getitems: function() {
        return smpitems;
    },
  }
})

.factory('OrderItems', function($http, $q, $ionicLoading, UserInfos, ZJSmpItems) {
  var orderinfos = {};
  var orderitems = [];
  return {
    listitems: function() {
      var deferred = $q.defer();
      $http.jsonp(UserInfos.geturl(), {params:{userid: UserInfos.get("userid"), option: 'repts4qy', sid: UserInfos.get("sessionid"),
                                                vbillcode: orderinfos.vbillcode, revwhseid: orderinfos.revwhseid}, timeout: 5000})
        .success(function(resp, status, headers, config) {
          deferred.resolve(resp); 
        })
        .error(function() {
          deferred.reject();
          $ionicLoading.hide();
          $ionicLoading.show({ template: '网络错误，你可以稍候重试!', duration: 1000, noBackdrop: true });
        });
      return deferred.promise;
    },
    set: function(key, val){
      orderinfos[key] = val;
    },
    get: function(key){
      return orderinfos[key];
    },
    setitems: function(items) {
      angular.copy(items, orderitems);
    }, 
    getitems: function() {
        return orderitems;
    }
  }
})

.factory('ShqrHisItems', function($http, $q, $ionicLoading, UserInfos, WhseInfos) {
  var hisitems = [];
  var lastid = 0;
  var hasmore = true;
  return {
    listitems: function() {
      var deferred = $q.defer();
      $http.jsonp(UserInfos.geturl(), {params: {userid: UserInfos.get("userid"), iid: lastid, option: 'shqrhis', sid: UserInfos.get("sessionid"),
                                                whseid: WhseInfos.get("whseid")}, timeout: 5000})
        .success(function(resp, status, headers, config) {
          deferred.resolve(resp); 
        })
        .error(function() {
          deferred.reject();
          $ionicLoading.hide();
          $ionicLoading.show({ template: '网络错误，你可以稍候重试!', duration: 1000, noBackdrop: true });
        });
      return deferred.promise;
    },
    setitems: function(items) {
        for (var i=0;i<items.length;i++) {
            var dict = {};
            for (var k in items[i]) {
                dict[k] = items[i][k];
            }
            hisitems.push(dict);
        }
    }, 
    clearitems: function() {
        hisitems.length = 0;
    },
    getitems: function() {
        return hisitems;
    },
    getlastid: function() {
        return lastid;
    },
    setlastid: function(id) {
        lastid = id;
    },
    gethasmore: function() {
        return hasmore;
    },
    sethasmore: function(b) {
        hasmore = b;
    }
  }
});

