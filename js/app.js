// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova'])

.run(['$ionicPlatform', '$ionicPopup','$rootScope','$location', function ($ionicPlatform, $ionicPopup, $rootScope, $location) {
    $ionicPlatform.registerBackButtonAction(function (e) {
        e.preventDefault();
        function showConfirm() {
            var confirmPopup = $ionicPopup.confirm({
                title: '<strong>退出系统?</strong>',
                template: '你确定要退出系统吗?',
                okText: '退出',
                cancelText: '取消'
            });

            confirmPopup.then(function (res) {
                if (res) {
                    ionic.Platform.exitApp();
                }
            });
        }

        var _srcpath = $location.path();
        if (['/login', '/tab/zjhis', '/tab/zjqy', '/tab/shqr', '/tab/infos', '/tab/zjlr', '/tab/shqrhis', '/tab/kphs'].indexOf(_srcpath) >= 0) 
            showConfirm();
        else if (_srcpath == '/whsechoose')
            $location.path('/orgchoose').replace();
        else if ($rootScope.$viewHistory.backView )
            $rootScope.$viewHistory.backView.go();
        else
            showConfirm();
        return false;
    }, 101);
}])

.config(function($stateProvider, $urlRouterProvider) {
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('login', {
        url: "/login",
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl'
    })
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html",
      controller: 'TabCtrl'
    })
    // 质检录入
    .state('tab.zjlr', {
      url: '/zjlr',
      views: {
        'tab-zjlr': {
          templateUrl: 'templates/zjlr.html',
          controller: 'zjlrCtrl'
        }
      }
    })
    // 质检历史
    .state('tab.zjhis', {
      url: '/zjhis',
      views: {
        'tab-zjhis': {
          templateUrl: 'templates/zjhis.html',
          controller: 'zjHisCtrl'
        }
      }
    })
    // 质检取样
    .state('tab.zjqy', {
      url: '/zjqy',
      views: {
        'tab-zjqy': {
          templateUrl: 'templates/zjqy.html',
          controller: 'zjSmpCtrl'
        }
      }
    })
    // 场地确认
    .state('tab.shqr', {
      url: '/shqr',
      views: {
        'tab-shqr': {
          templateUrl: 'templates/shqr.html',
          controller: 'shqrCtrl'
        }
      }
    })
    // 场地收货历史
    .state('tab.shqrhis', {
      url: '/shqrhis',
      views: {
        'tab-shqrhis': {
          templateUrl: 'templates/shqrhis.html',
          controller: 'shqrHisCtrl'
        }
      }
    })
    .state('tab.kphs', {
      url: '/kphs',
      views: {
        'tab-kphs': {
          templateUrl: 'templates/kphs.html',
          controller: 'KPHSCtrl'
        }
      }
    })
    .state('tab.infos', {
      url: '/infos',
      views: {
        'tab-infos': {
          templateUrl: 'templates/tab-infos.html',
          controller: 'InfosCtrl'
        }
      }
    })
    .state('tab.info-info', {
      url: '/info/info',
      views: {
        'tab-infos': {
          templateUrl: 'templates/info-info.html',
          controller: 'InfoInfoCtrl'
        }
      }
    })
    .state('tab.info-about', {
      url: '/info/about',
      views: {
        'tab-infos': {
          templateUrl: 'templates/info-about.html',
          controller: 'InfoAboutCtrl'
        }
      }
    })
    .state('tab.info-chgpwd', {
      url: '/info/chgpwd',
      views: {
        'tab-infos': {
          templateUrl: 'templates/info-chgpwd.html',
          controller: 'InfoChgpwdCtrl'
        }
      }
    })
    // 库存组织选择
    .state('orgchoose', {
      url: "/orgchoose",
      templateUrl: "templates/orgchoose.html",
      controller: 'OrgCtrl'
    })
    // 仓库选择
    .state('whsechoose', {
      url: "/whsechoose",
      templateUrl: "templates/whsechoose.html",
      controller: 'WhseCtrl'
    })
    // 订单详细信息
    .state('orderinfo', {
      url: "/orderinfo",
      templateUrl: "templates/orderinfo.html",
      controller: 'orderInfoCtrl'
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});

