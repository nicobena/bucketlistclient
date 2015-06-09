/**
 * Created by nico on 31/05/15.
 */
angular.module('bucketList.controllers', ['bucketList.services'])

    .controller('SignInCtrl', function ($rootScope, $scope, API, $window) {
        // if the user is already logged in, take him to his bucketlist
        if ($rootScope.isSessionActive()) {
            $window.location.href = ('#/bucket/list');
        } else {
            $window.location.href = ('#/auth/signin');
        }

        $scope.user = {
            email: "",
            password: ""
        };

        $scope.validateUser = function () {
            var email = this.user.email;
            var password = this.user.password;
            if(!email || !password) {
                $rootScope.notify("Please enter email and password");
                return false;
            }
            $rootScope.show('Please wait.. Authenticating');
            API.signin({
                email: email,
                password: password
            }).success(function (data) {
                $rootScope.setToken(email); // create a session kind of thing on the client side
                $rootScope.hide();
                $window.location.href = ('#/bucket/list');
            }).error(function (error) {
                $rootScope.hide();
                $rootScope.notify("Invalid Username or password");
            });
        }

    })

    .controller('SignUpCtrl', function ($rootScope, $scope, API, $window) {
        $scope.user = {
            email: "",
            password: "",
            name: ""
        };

        $scope.createUser = function () {
            var email = this.user.email;
            var password = this.user.password;
            var uName = this.user.name;
            if(!email || !password || !uName) {
                $rootScope.notify("Please enter you information");
                return false;
            }
            $rootScope.show('Please wait.. Registering');
            API.signup({
                email: email,
                password: password,
                name: uName
            }).success(function (data) {
                $rootScope.setToken(email); // create a session kind of thing on the client side
                $rootScope.hide();
                $window.location.href = ('#/bucket/list');
            }).error(function (error) {
                $rootScope.hide();
                if(error.error && error.error.code == 11000) {
                    $rootScope.notify("A user with this email already exists");
                } else {
                    $rootScope.notify("Oops something went wrong, Please try again!");
                }

            });
        }
    })

    .controller('myListCtrl', function ($rootScope, $scope, API, $timeout, $ionicModal, $window) {
        $rootScope.$on('fetchAll', function(){
            API.getAll($rootScope.getToken()).success(function (data, status, headers, config) {
                $rootScope.show("Please wait... Processing");
                $scope.list = [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i].isCompleted == false) {
                        $scope.list.push(data[i]);
                    }
                };
                if($scope.list.length == 0)
                {
                    $scope.noData = true;
                }
                else
                {
                    $scope.noData = false;
                }

                $ionicModal.fromTemplateUrl('templates/newItem.html', function (modal) {
                    $scope.newTemplate = modal;
                });

                $scope.newTask = function () {
                    $scope.newTemplate.show();
                };

                $ionicModal.fromTemplateUrl('templates/editItem.html', function(modal) {
                    $scope.editTemplate = modal;
                }, {
                    scope: $scope,
                    focusFirstInput: true
                });
                $scope.editTask = function (id, text) {
                    $rootScope.editData = {
                        id : id,
                        item : text
                    }

                    $scope.editTemplate.show();
                };
                $rootScope.hide();
            }).error(function (data, status, headers, config) {
                $rootScope.hide();
                $rootScope.notify("Oops something went wrong!! Please try again later");
            });
        });

        $rootScope.$broadcast('fetchAll');

        $scope.markCompleted = function (id) {
            $rootScope.show("Please wait... Updating List");
            API.editItem(id, {
                isCompleted: true
            }, $rootScope.getToken())
                .success(function (data, status, headers, config) {
                    $rootScope.hide();
                    $rootScope.doRefresh(1);
                }).error(function (data, status, headers, config) {
                    $rootScope.hide();
                    $rootScope.notify("Oops something went wrong!! Please try again later");
                });
        };

        $scope.deleteItem = function (id) {
            $rootScope.show("Please wait... Deleting from List");
            API.deleteItem(id, $rootScope.getToken())
                .success(function (data, status, headers, config) {
                    $rootScope.hide();
                    $rootScope.doRefresh(1);
                }).error(function (data, status, headers, config) {
                    $rootScope.hide();
                    $rootScope.notify("Oops something went wrong!! Please try again later");
                });
        };

    })

    .controller('completedCtrl', function ($rootScope, $scope, API, $window) {
        $rootScope.$on('fetchCompleted', function () {
            API.getAll($rootScope.getToken()).success(function (data, status, headers, config) {
                $scope.list = [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i].isCompleted == true) {
                        $scope.list.push(data[i]);
                    }
                };
                if(data.length > 0 & $scope.list.length == 0) {
                    $scope.incomplete = true;
                } else {
                    $scope.incomplete = false;
                }

                if(data.length == 0) {
                    $scope.noData = true;
                } else {
                    $scope.noData = false;
                }
            }).error(function (data, status, headers, config) {
                $rootScope.notify("Oops something went wrong!! Please try again later");
            });

        });

        $rootScope.$broadcast('fetchCompleted');
        $scope.deleteItem = function (id) {
            $rootScope.show("Please wait... Deleting from List");
            API.deleteItem(id, $rootScope.getToken())
                .success(function (data, status, headers, config) {
                    $rootScope.hide();
                    $rootScope.doRefresh(2);
                }).error(function (data, status, headers, config) {
                    $rootScope.hide();
                    $rootScope.notify("Oops something went wrong with deletion!! Please try again later");
                });
        };
    })

    .controller('newCtrl', function ($rootScope, $scope, API, $window) {
        $scope.data = {
            item: ""
        };

        $scope.newClose = function () {
            $scope.modal.hide();
        };

        $scope.createNew = function () {
            var item = this.data.item;
            $scope.modal.hide();

            $rootScope.show("Please wait... Creating new");

            var form = {
                item: item,
                isCompleted: false,
                user: $rootScope.getToken(),
                created: Date.now(),
                updated: Date.now()
            }

            API.saveItem(form, form.user)
                .success(function (data, status, headers, config) {
                    $rootScope.hide();
                    $rootScope.doRefresh(1);
                })
                .error(function (data, status, headers, config) {
                    $rootScope.hide();
                    $rootScope.notify("Oops something went wrong!! Please try again later");
                });
        };
    })

    .controller('editCtrl', function($rootScope, $scope, API, $window) {

        $scope.editClose = function () {
            $scope.editTemplate.hide();
        };

        $scope.editItem = function() {
            var item = this.editData.item,
                id = this.editData.id;
            if (!item) return;

            $rootScope.show("Please Wait... Updating Item.")

            API.editItem(id, {
                    item : item
                },
                $rootScope.getToken())

                .success(function(data, status, headers, config) {
                    $rootScope.hide();
                    $scope.editTemplate.hide();
                    $rootScope.doRefresh(1);
                }).error(function(data, status, headers, config) {
                    $rootScope.hide();
                    $rootScope.notify("Oops something went wrong!! Plesae try again later.");
                });
        };
    })