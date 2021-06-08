import Keycloak from "keycloak-js"

let keycloak = null;

export default {
    init() {
        return new Promise(function (resolve) {
            keycloak = new Keycloak({
                url: 'http://localhost:9090/auth/',
                realm: 'ids',
                clientId: 'configmanager'
            });
            keycloak.init({
                onLoad: 'login-required'
            }).then(function () {
                console.log(">>> INIT COMPLETE");
                resolve(keycloak);
            });
            console.log(">>> KEYCLOAK: ", keycloak);
        });
    },

    loadUserProfile() {
        return new Promise(function (resolve) {
            keycloak.loadUserProfile().then(info => {
                console.log(">>> loadUserProfile RESP: ", info);
                resolve(info);
            });
        });
    },

    hasRole(roleList) {
        let response = false;
        for (let role of roleList) {
            if (keycloak.hasRealmRole(role)) {
                response = true;
                break;
            }
        }
        return response;
    },

    logout() {
        keycloak.logout();
    }
}
