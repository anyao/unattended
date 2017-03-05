angular.module('starter.controllers', [])

.controller("TabCtrl",function($scope, UserInfos, $location){
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }

  $scope.ifQual = (UserInfos.get("funcs").indexOf('weighmgr_zjlr') >= 0);
  $scope.ifQualHis = (UserInfos.get("funcs").indexOf('weighmgr_zjhis') >= 0);
  $scope.ifQualSmp = (UserInfos.get("funcs").indexOf('weighmgr_zjqy') >= 0);
  $scope.ifSpot = (UserInfos.get("funcs").indexOf('weighmgr_shqr') >= 0);
  $scope.ifSpotHis = (UserInfos.get("funcs").indexOf('weighmgr_qrhis') >= 0);
  $scope.ifRecyc = (UserInfos.get("funcs").indexOf('weighmgr_kphs') >= 0);

  $scope.tabClick = function(tabidx) {
      var loc = ["", "/tab/zjlr", "/tab/zjhis", "tab/zjqy", "/tab/shqr", "/tab/shqrhis", "/tab/kphs", "/tab/infos"];
      $location.path(loc[tabidx]).replace();
  }
})

.controller('LoginCtrl', function($scope, $location, $http, $ionicLoading, $ionicPopup, $ionicPlatform, $cordovaDevice, $cordovaPreferences, UserInfos, ProdInfos, WhseInfos) {
  $scope.loginData = {empcode:"", password:"", isNetConnect: UserInfos.getcontp(), uuid: "", model: ""};

  $scope.allowreg = false;
  $scope.allowlogin = false;
  $scope.hasnewver = false;
  $scope.newver = ProdInfos.ver();
  $scope.serverroot = UserInfos.getrooturl();

  $scope.queryInfo = function() {
    $scope.allowreg = false;
    $scope.allowlogin = false;
    if (typeof $scope.loginData.uuid == "undefined" || $scope.loginData.uuid == "") {
      $ionicLoading.show({ template: '错误：未能获取正确的绑定标识', noBackdrop: true, duration:4000});
      return;
    }
    $ionicLoading.show({ template: '<div class="ion-loading-a"></div>&nbsp;&nbsp;正在获取软件更新...', noBackdrop: true });

    UserInfos.setcontp($scope.loginData.isNetConnect);
    $http.jsonp(UserInfos.geturl(), {params: {uuid: $scope.loginData.uuid, option: 'validuuid'}, timeout: 5000})
        .success(function(resp) {
            $ionicLoading.hide();
            if (resp.errmsg != "") {
              $ionicLoading.show({ template: '错误:' + resp.errmsg, noBackdrop: true, duration:5000});
              return;
            }

            $scope.allowlogin = (resp.status == "actived");
            $scope.allowreg = (resp.status == "unbound");
            $scope.hasnewver = (resp.ver != ProdInfos.ver());
            $scope.newver = resp.ver;
            UserInfos.setkey("sessionid", resp.sessionid);
            $scope.serverroot = UserInfos.getrooturl();
            switch (resp.status){
              case "unbound":
                $ionicLoading.show({ template: '设备未绑定，请先绑定。', noBackdrop: true, duration:4000});
                return;
              case "unactived":
                $ionicLoading.show({ template: '设备未激活，请联系管理员激活。', noBackdrop: true, duration:4000});
                return;
              case "actived":
                UserInfos.set(resp);
                break;
              default:
                return;
            }
        })
        .error(function(data, status) {
          $ionicLoading.show({ template: '错误：网络连接异常，您可以试着切换内外网连接或稍候重试', noBackdrop: true, duration:4000});
        });
  };

  $scope.toRegister = function() {
    if ($scope.loginData.empcode == "") {
      $ionicLoading.show({ template: '错误：用户名不能为空', noBackdrop: true, duration:4000});
      return;
    }
    if ($scope.loginData.password == "") {
      $ionicLoading.show({ template: '错误：密码不能为空', noBackdrop: true, duration:4000});
      return;
    }
    UserInfos.setcontp($scope.loginData.isNetConnect);
    $scope.serverroot = UserInfos.getrooturl();
    var errmsgs = {invaliduser: "用户名不存在或密码错误", invaliduuid: "用户已绑定至其他手机" };

    $ionicLoading.show({ template: '<div class="ion-loading-a"></div>&nbsp;&nbsp;正在绑定手机信息...', noBackdrop: true });

    $http.jsonp(UserInfos.geturl(), {params: {userid: $scope.loginData.empcode, pwd: $scope.loginData.password, uuid: $scope.loginData.uuid, model: $scope.loginData.model, sid: UserInfos.get("sessionid"), option: 'binduuid'}, timeout: 5000})
        .success(function(resp, status, headers, config) {
            $ionicLoading.hide();
            if (resp.errmsg == "") {
                $scope.allowreg = false;
                $scope.allowlogin = false;
                $ionicLoading.show({ template: '设备已绑定成功，请联系管理员激活。', noBackdrop: true, duration:4000});
                return;
            }
            $scope.allowreg = true;
            $scope.allowlogin = false;
            if (resp.errmsg == "tologin") {
                $ionicLoading.show({ template: '绑定设备发生意外错误，可以稍后重试。', noBackdrop: true, duration:4000});
                return;
            }
            var msg = resp.errmsg;
            if (msg == "invaliduser" || msg == "invaliduuid")
                msg = errmsgs[msg];
            var alertPopup = $ionicPopup.alert({
              title: '错误',
              template: msg
            });
            alertPopup.then(function(res) { });
        })
        .error(function(data, status) {
          $scope.allowreg = true;
          $scope.allowlogin = false;
          $ionicLoading.hide();
          $ionicLoading.show({ template: '错误：网络连接异常，您可以试着切换内外网连接或稍候重试', noBackdrop: true, duration:4000});
        });
  };

  $scope.tryLogin = function() {
    if ($scope.loginData.empcode == "") {
      $ionicLoading.show({ template: '错误：用户名不能为空', noBackdrop: true, duration:4000});
      return;
    }
    if ($scope.loginData.password == "") {
      $ionicLoading.show({ template: '错误：密码不能为空', noBackdrop: true, duration:4000});
      return;
    }
    UserInfos.setcontp($scope.loginData.isNetConnect);
    $scope.serverroot = UserInfos.getrooturl();

    $ionicLoading.show({ template: '<div class="ion-loading-a"></div>&nbsp;&nbsp;正在验证登录信息...', noBackdrop: true });

    $http.jsonp(UserInfos.geturl(), {params: {userid: $scope.loginData.empcode, pwd: $scope.loginData.password, uuid: $scope.loginData.uuid, sid: UserInfos.get("sessionid"), option: 'login'}, timeout: 5000})
        .success(function(resp) {
            $ionicLoading.hide();
            if (resp.code == "0") {
              var alertPopup = $ionicPopup.alert({
                title: '错误',
                template: '用户名不存在或密码错误'
              });
              alertPopup.then(function(res) { });
            }else if (resp.code == "2") {
              var alertPopup = $ionicPopup.alert({
                title: '错误',
                template: '请联系管理员激活手机绑定'
              });
              alertPopup.then(function(res) { });
            }else if (resp.code == "3") {
              var alertPopup = $ionicPopup.alert({
                title: '错误',
                template: '手机绑定错误'
              });
              alertPopup.then(function(res) { });
            }else {
              $cordovaPreferences.store('userid', $scope.loginData.empcode);
              UserInfos.set(resp);
              WhseInfos.set("orgid", null);
              WhseInfos.set("whseid", null);
              WhseInfos.set("pk_corp", null);
              WhseInfos.set("whsename", null);
              WhseInfos.listitems().then(function() {
                  $cordovaPreferences.fetch('orgid')
                      .success(function(orgid) {
                        if (WhseInfos.alloworg(orgid)) {
                            WhseInfos.set("orgid", orgid);
                            $cordovaPreferences.fetch('whseid')
                              .success(function(whseid) {
                                if (WhseInfos.allowwhse(whseid)) {
                                    WhseInfos.set("whseid", whseid);
                                    $cordovaPreferences.fetch('whsename')
                                      .success(function(value) {
                                         WhseInfos.set("whsename", value);
                                    });
                                    $cordovaPreferences.fetch('pk_corp')
                                      .success(function(value) {
                                         WhseInfos.set("pk_corp", value);
                                    });
                                }
                            });
                        }
                  });
              });

              if (UserInfos.get("funcs").indexOf('weighmgr_zjlr') >= 0) 
                $location.path('/tab/zjlr').replace();
              else
                $location.path('/tab/shqr').replace();
            }
        })
        .error(function(data, status) {
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({
            title: '错误',
            template: '网络连接异常，您可以试着切换内外网连接或稍候重试'
          });
          alertPopup.then(function(res) { });
        });
  };

  if (UserInfos.get('userid') != null) {
      if (UserInfos.get("funcs").indexOf('weighmgr_zjlr') >= 0) 
        $location.path('/tab/zjlr').replace();
      else
        $location.path('/tab/shqr').replace();
  }else {
      document.addEventListener("deviceready", function () {
        $scope.loginData["uuid"] =  $cordovaDevice.getUUID();
        $scope.loginData["model"] = $cordovaDevice.getModel();

        $scope.queryInfo();

        $cordovaPreferences.fetch('userid')
          .success(function(value) {
            $scope.loginData.empcode = value;
        });

        screen.lockOrientation('portrait');
      }, false);
      // $scope.loginData["uuid"] =  "abef7fcf7a177451";
      // $scope.loginData["model"] = "SM-G9200";
      // $scope.queryInfo();
  }
})

// 质检录入表单
.controller('zjlrCtrl', function($scope, $http, $ionicLoading, $location, $ionicActionSheet, $ionicPopup, $timeout, UserInfos, nfcService) {
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }

  var trim = function(str){ 
    return str.replace(/(^\s*)|(\s*$)/g, "");
  }

  // nfc获取数据
  $scope.rept = nfcService.zjtag;
  nfcService.clearZjTag();

  $scope.edit = {water:"", powder:"",other:"", iid: "", sid: UserInfos.get("sessionid"), 
                 userid: UserInfos.get("userid"), option: 'savezj'};

  var form_submit = function(){
    $scope.edit.iid = $scope.rept.iid;
    $ionicLoading.show({ template: '<div class="ion-loading-a"></div>&nbsp;&nbsp;数据提交中...', noBackdrop: true });
    $http.jsonp(UserInfos.geturl(), {params: $scope.edit, timeout: 5000})
     .success(function(resp, status, headers, config) {
         $ionicLoading.hide();
         if (resp.errmsg == "") {
           $scope.edit["water"] = "";
           $scope.edit["powder"] = "";
           $scope.edit["other"] = "";
           $scope.edit["iid"] = "";
           nfcService.clearZjTag();
           var alertPopup = $ionicPopup.show({
             title: '成功',
             template: "质检信息已成功提交至服务器！",
             scope: $scope,
             buttons: [
               {text: '<b>确定</b>'}
             ]
           });
           alertPopup.then(function(res) { });
           $timeout(function() {
               alertPopup.close();
           }, 3000);
         }else {
           if (resp.errmsg == "tologin")
               $location.path('/login').replace();
           else {
               var alertPopup = $ionicPopup.alert({
                   title: '错误',
                   template: resp.errmsg
               });
               alertPopup.then(function(res){});
           }
         }
     })
     .error(function(data, status) {
       $ionicLoading.show({ template: '网络错误，你可以稍候重试' + data.errmsg, duration: 5000, noBackdrop: true });
     });
  }

  $scope.presubmit = function() {
    if ($scope.rept.iid == "") {
      $ionicLoading.show({ template: '磅单信息不正确，请重新刷卡', duration: 1500, noBackdrop: true });
      return;
    }
    // 验证扣水、扣粉、扣杂是否是数字
    var arr = [{val: $scope.edit.water, str: "扣水"},
               {val: $scope.edit.powder, str: "扣粉"},
               {val: $scope.edit.other, str: "扣杂"}];
    var errmsg = "";
    for (var i = 0; i < arr.length; i++) {
      arr[i].val = trim(arr[i].val);
      if (arr[i].val == "") {
          if (errmsg != "")
              errmsg += ",";
          errmsg += arr[i].str;
      }else if (isNaN(arr[i].val)) {
          $ionicLoading.show({ template: arr[i].str + "必须输入浮点数", duration: 1500, noBackdrop: true });
          return;
      }
    }
    if (errmsg != "") {
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          { text:  '继续提交'}
        ],
        titleText: errmsg + '为空，是否确定要继续提交吗？',
        cancelText: '取消',
        buttonClicked: function(index) {
         form_submit();
         return true;
        }
      });

      $timeout(function() {
        hideSheet();
      }, 3000);
    }else
      form_submit(); 
  }
})

// 质检录入历史
.controller('zjHisCtrl', function($scope, $ionicLoading, $location, UserInfos, ZjHisItems) {
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }
  // 是否停止上拉加载
  $scope.ifMore = ZjHisItems.gethasmore();
  // 质检待录入列表
  $scope.zjhisitems = ZjHisItems.getitems();

  $scope.loadMore = function() {
    ZjHisItems.listitems().then(function(data) {
      if (data.errmsg != "") {
        if (data.errmsg == "tologin")
            $location.path('/login').replace();
        else
            $ionicLoading.show({ template: '错误：'+resp.errmsg, noBackdrop: true });
      }else {
          if (data.list.length > 0){
            ZjHisItems.setlastid(data.list[data.list.length - 1].iid); 
            ZjHisItems.setitems(data.list);
          }else {
            $scope.ifMore = false;
            ZjHisItems.sethasmore(false);
          }
          $scope.$broadcast('scroll.infiniteScrollComplete');
      }
    });
  }

  $scope.refresh = function() {
    ZjHisItems.setlastid(0); 
    ZjHisItems.clearitems();
    $scope.ifMore = true;
    ZjHisItems.sethasmore(true);
    $scope.loadMore();
    $scope.$broadcast('scroll.refreshComplete');
  }
})

.controller('zjSmpCtrl', function($scope,$ionicLoading, $location, UserInfos, ZJSmpItems, $state, OrderItems){
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }

  var loadMore = function() {
    ZJSmpItems.listitems().then(function(data) {
      if (data.errmsg != "") {
        if (data.errmsg == "tologin")
          $location.path('/login').replace();
        else
          $ionicLoading.show({ template: '错误：'+resp.errmsg, noBackdrop: true });
      }else {
        ZJSmpItems.setitems(data.list);
      }
    });
  }

  // 质检取样列表
  $scope.zjsmpitems = ZJSmpItems.getitems();
  if ($scope.zjsmpitems == "") 
    loadMore();

  $scope.toOrder = function(item){
    angular.forEach(item, function(val, key){
      OrderItems.set(key, val);
    });
    $state.go('orderinfo');
    return;
  }


  $scope.refresh = function() {
    ZJSmpItems.clearitems();
    loadMore();
    $scope.$broadcast('scroll.refreshComplete');
  }
})

.controller('orderInfoCtrl', function($scope, $location, $http, UserInfos, OrderItems, $ionicPopup, $timeout, $ionicLoading){
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }

   var orderList = function() {
    OrderItems.listitems().then(function(data) {
      if (data.errmsg != "") {
        if (data.errmsg == "tologin")
          $location.path('/login').replace();
        else
          $ionicLoading.show({ template: '错误：'+resp.errmsg, noBackdrop: true });
      }else {
        OrderItems.setitems(data.list);
      }
    });
  }

  $scope.toBack = function() {
   $location.path("/tab/zjqy");
  };

  $scope.rept = OrderItems.getitems();
  orderList();

  $scope.presubmit = function(){
    var scaleids = "";
    angular.forEach($scope.rept, function(val, key){
      if(val.check == true){
        scaleids += val.iid + ",";
      }
    });
    scaleids = scaleids.substring(0,scaleids.length-1);
    // scaleids,invbasid,invmanid,invname,venderbasid,vendermanid,vendername,revwhseid,pk_corp
    var reqdata = {scaleids: scaleids, invbasid: OrderItems.get("invbasid"), invmanid: OrderItems.get("invmanid"), 
                   invname: OrderItems.get("invname"), venderbasid: OrderItems.get("venderbasid"),  vendermanid: OrderItems.get("vendermanid"),
                   vendername: OrderItems.get("vendername"), revwhseid: OrderItems.get("revwhseid"), pk_corp: OrderItems.get("revcorp"), 
                  sid: UserInfos.get("sessionid"), userid: UserInfos.get("userid"), option: 'scqy'};

    $ionicLoading.show({ template: '<div class="ion-loading-a"></div>&nbsp;&nbsp;数据提交中...', noBackdrop: true });
    $http.jsonp(UserInfos.geturl(), {params: reqdata, timeout: 5000})
       .success(function(resp) {
        // alert("hello");
           $ionicLoading.hide();
           if (resp.errmsg == "") {
             var alertPopup = $ionicPopup.show({
               title: '成功',
               template: "信息已成功提交！",
               scope: $scope,
               buttons: [
                 {text: '<b>确定</b>',
                  onTap: function() {
                      $location.path("/tab/zjqy");
                    }
                  }
               ]
             });
             alertPopup.then(function(res) { });
             $timeout(function() {
               alertPopup.close();
               $location.path("/tab/zjqy");
             }, 3000);
           }else {
             if (resp.errmsg == "tologin")
                 $location.path('/login').replace();
             else {
                  var alertPopup = $ionicPopup.alert({
                    title: '错误',
                    template: resp.errmsg
                  });
                  alertPopup.then(function(res) { });
             }
           }
       })
       .error(function(data, status) {
        alert("world");
          $ionicLoading.show({ template: '错误：网络连接异常，您可以试着切换内外网连接或稍候重试', noBackdrop: true, duration:1500});
       });
  }


})

.controller('shqrCtrl',function($scope, $http, $ionicNavBarDelegate, $cordovaPreferences, $timeout, $ionicActionSheet, $ionicLoading, UserInfos, $location, WhseInfos, nfcService){
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }

  if (WhseInfos.get("orgid") == null) {
    WhseInfos.set("srcpage", "/tab/shqr");
    $location.path('/orgchoose').replace();
    return;
  }

  if (WhseInfos.get("whseid") == null) {
    WhseInfos.set("srcpage", "/tab/shqr");
    $location.path('/whsechoose').replace();
    return;
  }
 
  $timeout(function() {
      $ionicNavBarDelegate.showBackButton(false);
  });

  $scope.whsename = WhseInfos.get("whsename");

  $scope.towhsechoose = function(){
    WhseInfos.set("srcpage", "/tab/shqr");
    $location.path('/whsechoose').replace();
  }

  // nfc获取数据
  $scope.rept = nfcService.shqrtag;
  nfcService.clearShqrTag();

  var shqr_save = function(){
    // userid, whseid, whsename,whseorgid,iid
    var reqdata = {iid: $scope.rept.iid, whseid: WhseInfos.get("whseid"), whsename: WhseInfos.get("whsename"), pk_corp: WhseInfos.get("pk_corp"), whseorgid: WhseInfos.get("orgid"),
                  sid: UserInfos.get("sessionid"), userid: UserInfos.get("userid"), option: 'shqr'};
    $ionicLoading.show({ template: '<div class="ion-loading-a"></div>&nbsp;&nbsp;数据提交中...', noBackdrop: true });
    $http.jsonp(UserInfos.geturl(), {params: reqdata, timeout: 5000})
       .success(function(resp, status, headers, config) {
           $ionicLoading.hide();
           if (resp.errmsg == "") {
             nfcService.clearShqrTag();
             var alertPopup = $ionicPopup.show({
               title: '成功',
               template: "质检信息已成功提交至服务器！",
               scope: $scope,
               buttons: [
                 {text: '<b>确定</b>'}
               ]
             });
             alertPopup.then(function(res) { });
             $timeout(function() {
               alertPopup.close();
             }, 3000);
           }else {
             if (resp.errmsg == "tologin")
                 $location.path('/login').replace();
             else {
                  var alertPopup = $ionicPopup.alert({
                    title: '错误',
                    template: resp.errmsg
                  });
                  alertPopup.then(function(res) { });
             }
           }
       })
       .error(function(data, status) {
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({
            title: '错误',
            template: '网络连接异常，您可以试着切换内外网连接或稍候重试'
          });
          alertPopup.then(function(res) { });
       });
  }

  // 点击场地确认
  $scope.presubmit = function() {
    var hideSheet = $ionicActionSheet.show({
        buttons: [{ text: '确认' }],
        titleText: '将 <b>' + $scope.rept.hphm + '</b> 的 <b>' + $scope.rept.invname + '</b><br/>收货至 <b>' + WhseInfos.get("whsename") + '</b> ?',
        cancelText: '取消',
        buttonClicked: function(index) {
          shqr_save();
          return true;
        }
    });
    $timeout(function() {
        hideSheet();
    },5000);
  }
})

.controller('shqrHisCtrl', function($scope, $location, $ionicLoading, $ionicNavBarDelegate, $timeout, ShqrHisItems, UserInfos, WhseInfos) {
  // 登录失效
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }

  if (WhseInfos.get("orgid") == null) {
    WhseInfos.set("srcpage", "/tab/shqrhis");
    $location.path('/orgchoose').replace();
    return;
  }

  if (WhseInfos.get("whseid") == null) {
    WhseInfos.set("srcpage", "/tab/shqrhis");
    $location.path('/whsechoose').replace();
    return;
  }

  // 返回上一层按钮隐藏
  $timeout(function() {
      $ionicNavBarDelegate.showBackButton(false);
  });

  $scope.towhsechoose = function(){
    WhseInfos.set("srcpage", "/tab/shqrhis");
    $location.path('/whsechoose').replace();
  }

  $scope.whsename = WhseInfos.get("whsename");
  $scope.ifMore = ShqrHisItems.gethasmore();
  $scope.hisitems = ShqrHisItems.getitems();

  $scope.loadMore = function() {
    ShqrHisItems.listitems().then(function(data) {
      if (data.errmsg != "") {
        if (data.errmsg == "tologin")
            $location.path('/login').replace();
        else
          $ionicLoading.show({ template: '错误：' + resp.errmsg, noBackdrop: true });
      }else {
          if (data.list.length > 0){
            ShqrHisItems.setlastid(data.list[data.list.length - 1].iid);
            ShqrHisItems.setitems(data.list);
          }else {
            $scope.ifMore = false;
            ShqrHisItems.sethasmore(false);
          }
          $scope.$broadcast('scroll.infiniteScrollComplete');
      }
    });
  }

  $scope.refresh = function() {
    ShqrHisItems.setlastid(0); 
    ShqrHisItems.clearitems();
    $scope.ifMore = true;
    ShqrHisItems.sethasmore(true);
    $scope.loadMore();
    $scope.$broadcast('scroll.refreshComplete');
    }
  })

.controller('OrgCtrl', function ($scope, $location, $ionicLoading, $ionicNavBarDelegate, $timeout, $cordovaPreferences, UserInfos, WhseInfos) {
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }

  $timeout(function() {
      $ionicNavBarDelegate.showBackButton(false);
  });

  $scope.hasorgid = (WhseInfos.get("orgid") != null);

  $scope.orgitems = WhseInfos.getorgs();

  $scope.toback = function() {
    $location.path(WhseInfos.get("srcpage")).replace();
  }

  $scope.orgselected = function(orgid){
    WhseInfos.set("orgid", orgid);
    WhseInfos.set("whseid", null);
    WhseInfos.set("whsename", null);
    WhseInfos.set("pk_corp", null);
    $cordovaPreferences.store('orgid', WhseInfos.get("orgid"));
    $location.path('/whsechoose').replace();
  }
})

.controller('WhseCtrl', function($scope, $location, $ionicNavBarDelegate, $cordovaPreferences, $timeout, UserInfos, WhseInfos){
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }

  $timeout(function() {
      $ionicNavBarDelegate.showBackButton(false);
  });

  var orgid = WhseInfos.get("orgid");
  if (orgid == null || orgid == "") {
    $location.path("/orgchoose").replace();
    return;
  }

  $scope.whseitems = WhseInfos.getwhses(orgid);

  $scope.toorgchoose = function() {
    $location.path("/orgchoose").replace();
  }

  $scope.whseselected = function(whseid, whsename, pk_corp){
    WhseInfos.set("whseid", whseid);
    WhseInfos.set("whsename", whsename);
    WhseInfos.set("pk_corp", pk_corp);
    $cordovaPreferences.store('whseid', WhseInfos.get("whseid"));
    $cordovaPreferences.store('whsename', WhseInfos.get("whsename"));
    $cordovaPreferences.store('pk_corp', WhseInfos.get("pk_corp"));
    $location.path(WhseInfos.get("srcpage")).replace();
  }
})

.controller("KPHSCtrl", function($scope, $location, $state, $ionicLoading, nfcService, $ionicActionSheet, $timeout, UserInfos, $http,$ionicPopup){
    if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }

  // nfc获取数据
  $scope.rept = nfcService.cardtag;
  nfcService.clearCardTag();

  var kphs_save = function(){
    // userid, whseid, whsename,whseorgid,iid
    var reqdata = {iid: $scope.rept.iid, sid: UserInfos.get("sessionid"), userid: UserInfos.get("userid"), option: 'kphs'};
    $ionicLoading.show({ template: '<div class="ion-loading-a"></div>&nbsp;&nbsp;数据提交中...', noBackdrop: true });
    $http.jsonp(UserInfos.geturl(), {params: reqdata, timeout: 5000})
       .success(function(resp, status, headers, config) {
           $ionicLoading.hide();
           if (resp.errmsg == "") {
             nfcService.clearCardTag();
             var alertPopup = $ionicPopup.show({
               title: '成功',
               template: "卡片回收成功！",
               scope: $scope,
               buttons: [
                 {text: '<b>确定</b>'}
               ]
             });
             alertPopup.then(function(res) { });
             $timeout(function() {
               alertPopup.close();
             }, 3000);
           }else {
             if (resp.errmsg == "tologin")
                 $location.path('/login').replace();
             else {
                  var alertPopup = $ionicPopup.alert({
                    title: '错误',
                    template: resp.errmsg
                  });
                  alertPopup.then(function(res) { });
             }
           }
       })
       .error(function(data, status) {
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({
            title: '错误',
            template: '网络连接异常，您可以试着切换内外网连接或稍候重试'
          });
          alertPopup.then(function(res) { });
       });
  }

  // 点击场地确认
  $scope.presubmit = function() {
    var hideSheet = $ionicActionSheet.show({
        buttons: [{ text: '确认' }],
        titleText: '确认回收卡片？',
        cancelText: '取消',
        buttonClicked: function(index) {
          kphs_save();
          return true;
        }
    });
    $timeout(function() {
        hideSheet();
    },5000);
  }
})

.controller('InfosCtrl', function($scope, $ionicPopup, $location, UserInfos) {
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }
  $scope.toLogout = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: '<strong>登出系统?</strong>',
      template: '你确定要登出系统吗?',
      okText: '登出',
      cancelText: '取消'
    });

    confirmPopup.then(function (res) {
      if (res) {
        UserInfos.clear();
        $location.path('/login').replace();
      }
    });
  }

  $scope.toExit = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: '<strong>关闭系统?</strong>',
      template: '你确定要关闭系统吗?',
      okText: '关闭',
      cancelText: '取消'
    });

    confirmPopup.then(function (res) {
      if (res) {
        ionic.Platform.exitApp();
      }
    });
  }
})

.controller('InfoInfoCtrl', function($scope, $location, UserInfos, WhseInfos) {
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }
  $scope.userinfo = UserInfos.all();
  $scope.whses = WhseInfos.getitems();
})

.controller('InfoAboutCtrl', function($scope, $location, $http, $ionicLoading, $ionicPopup, $cordovaDevice, UserInfos, ProdInfos) {
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }
  $scope.serverroot = UserInfos.getrooturl();
  $scope.uuid = UserInfos.get("uuid");
  $scope.model = UserInfos.get("model");
  $scope.ver = ProdInfos.ver();
  $scope.androidver = $cordovaDevice.getVersion();
  $scope.publishat = ProdInfos.publishat();
  $scope.addr = UserInfos.get("addr");
  $scope.zrr = UserInfos.get("zrr");
  $scope.hasnewver = false;
  $scope.queryver = function() {
    $ionicLoading.show({ template: '<div class="ion-loading-a"></div>&nbsp;&nbsp;正在获取软件更新...', noBackdrop: true });

    $http.jsonp(UserInfos.geturl(), {params: {sid: UserInfos.get("sessionid"), option: 'ver'}, timeout: 5000})
        .success(function(resp, status, headers, config) {
            $ionicLoading.hide();
            $scope.hasnewver = (resp.ver != ProdInfos.ver());
        })
        .error(function(data, status) {
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({
            title: '错误',
            template: "网络连接异常，您可以试着切换内外网连接或稍候重试"
          });
          alertPopup.then(function(res) { });
        });
  };
  $scope.queryver();
})

.controller('InfoChgpwdCtrl', function($scope, $http, $ionicPopup, $location, $ionicLoading, UserInfos) {
  if (UserInfos.get("userid") == null) {
    $location.path('/login').replace();
    return;
  }
  $scope.chgpwdData = {pwd: "", pwd1: ""};
  $scope.tryChgpwd = function() {
    if ($scope.chgpwdData.pwd == "") {
      var alertPopup = $ionicPopup.alert({
        title: '错误',
        template: "密码不能为空"
      });
      alertPopup.then(function(res) { });
      return;
    }
    if ($scope.chgpwdData.pwd1 != $scope.chgpwdData.pwd) {
      var alertPopup = $ionicPopup.alert({
        title: '错误',
        template: "确认密码不匹配"
      });
      alertPopup.then(function(res) { });
      return;
    }
    $http.jsonp(UserInfos.geturl(), {params: {pwd: $scope.chgpwdData.pwd, empiid: UserInfos.get("userid"), option: 'chgpwd', sid: UserInfos.get("sessionid")}, timeout: 5000})
        .success(function(resp, status, headers, config) {
            $ionicLoading.hide();
            if (resp.errmsg == "") {
              if (resp.errmsg == "tologin")
                  $location.path('/login').replace();
              else {
                  var alertPopup = $ionicPopup.alert({
                    title: '提示',
                    template: '密码更改成功，将在您下次登录时生效'
                  });
                  alertPopup.then(function(res) { });
                  $location.path('/tab/infos').replace();
              }
            }else {
              var alertPopup = $ionicPopup.alert({
                title: '错误',
                template: '密码未更改成功，您可以稍候重试'
              });
              alertPopup.then(function(res) { });
            }
        })
        .error(function(data, status) {
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({
            title: '错误',
            template: '网络错误，你可以稍候重试'
          });
          alertPopup.then(function(res) { });
        });
  };
});
