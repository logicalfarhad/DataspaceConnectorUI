import moment from 'moment';
import clientDataModel from "@/datamodel/clientDataModel";
import restUtils from "./restUtils";

const POLICY_N_TIMES_USAGE = "N Times Usage";
const POLICY_DURATION_USAGE = "Duration Usage";
const POLICY_USAGE_DURING_INTERVAL = "Usage During Interval";
const POLICY_PROVIDE_ACCESS = "Provide Access";
const POLICY_PROHIBIT_ACCESS = "Prohibit Access";
const POLICY_USAGE_UNTIL_DELETION = "Usage Until Deletion";
const POLICY_USAGE_LOGGING = "Usage Logging";
const POLICY_USAGE_NOTIFICATION = "Usage Notification";

const POLICY_DESCRIPTION_TO_NAME = {
    "n-times-usage": POLICY_N_TIMES_USAGE,
    "duration-usage": POLICY_DURATION_USAGE,
    "usage-during-interval": POLICY_USAGE_DURING_INTERVAL,
    "provide-access": POLICY_PROVIDE_ACCESS,
    "prohibit-access": POLICY_PROHIBIT_ACCESS,
    "usage-until-deletion": POLICY_USAGE_UNTIL_DELETION,
    "usage-logging": POLICY_USAGE_LOGGING,
    "usage-notification": POLICY_USAGE_NOTIFICATION
};

const OPERATOR_TYPE_TO_SYMBOL = {
    "https://w3id.org/idsa/code/EQ": "=",
    "https://w3id.org/idsa/code/LTEQ": "<=",
    "https://w3id.org/idsa/code/LT": "<",
};


let languages = null;
let apps = null;
let backendConnections = null;
let connectorAddress = null;

export default {
    POLICY_PROVIDE_ACCESS,
    POLICY_PROHIBIT_ACCESS,
    POLICY_N_TIMES_USAGE,
    POLICY_DURATION_USAGE,
    POLICY_USAGE_DURING_INTERVAL,
    POLICY_USAGE_UNTIL_DELETION,
    POLICY_USAGE_LOGGING,

    escape(text) {
        return encodeURIComponent(text);
    },

    getPolicyNames() {
        return Object.values(POLICY_DESCRIPTION_TO_NAME);
    },

    getValue(data, name) {
        let value = "-";
        if (data[name] !== undefined && data[name] != null) {
            if (Array.isArray(data[name])) {
                value = data[name][0]["@value"];
            } else {
                value = data[name]["@id"];
            }
        }
        return value;
    },

    convertDescriptionToPolicyName(type) {
        return POLICY_DESCRIPTION_TO_NAME[type];
    },

    convertOperatorTypeToSymbol(type) {
        return OPERATOR_TYPE_TO_SYMBOL[type];
    },

    convertOperatorSymbolToType(symbol) {
        let type = "";
        for (let [key, value] of Object.entries(OPERATOR_TYPE_TO_SYMBOL)) {
            if (value == symbol) {
                type = key;
                break;
            }
        }
        return type;
    },

    getOfferedResourcesStats() {
        return new Promise(function (resolve) {
            restUtils.call("GET", "/api/ui/resources").then(response => {
                if (response.data.name !== undefined && response.data.name == "Error") {
                    resolve(response.data);
                } else {
                    let resources = response.data;
                    let totalSize = 0;
                    for (let resource of resources) {
                        if (resource["ids:representation"] !== undefined) {
                            if (resource["ids:representation"][0]["ids:instance"] !== undefined) {
                                totalSize += resource["ids:representation"][0]["ids:instance"][0]["ids:byteSize"];
                            }
                        }
                    }
                    resolve({
                        totalNumber: resources.length,
                        totalSize: totalSize
                    });
                }
            }).catch(error => {
                resolve(error);
            });
        });
    },

    async getResources() {
        let response = (await restUtils.callConnector("GET", "/api/offers"))["_embedded"].resources;
        let resources = [];
        for (let idsResource of response) {
            resources.push(clientDataModel.convertIdsResource(idsResource));
        }
        return resources;
    },

    getResource(id) {
        return new Promise(function (resolve) {
            restUtils.call("GET", "/api/ui/resource", {
                "resourceId": id
            }).then(response => {
                resolve(clientDataModel.convertIdsResource(response.data));
            }).catch(error => {
                console.log("Error in loadResource(): ", error);
                resolve(error);
            });
        });
    },

    async getLanguages() {
        if (languages == null) {
            let languages = (await restUtils.call("GET", "/api/ui/enum/Language"));
            return languages;
        } else {
            return languages;
        }
    },

    async registerConnectorAtBroker(brokerUri) {
        let params = {
            "recipient": brokerUri
        };
        await restUtils.callConnector("POST", "/api/ids/connector/update", params);
    },

    unregisterConnectorAtBroker(brokerUri) {
        return new Promise(function (resolve) {
            let params = {
                "brokerUri": brokerUri
            };
            restUtils.call("POST", "/api/ui/broker/unregister", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in unregisterConnectorAtBroker(): ", error);
                resolve(error);
            });
        });
    },

    async getResourceRegistrationStatus(resourceId) {
        let params = {
            "resourceId": resourceId
        }
        let response = (await restUtils.call("GET", "/api/ui/broker/resource/information", params));
        return response;
    },

    updateResourceAtBroker(brokerUri, resourceId) {
        let params = {
            "recipient": brokerUri,
            "resourceId": resourceId
        };
        restUtils.callConnector("POST", "​/api​/ids​/resource​/update", params);
    },

    deleteResourceAtBroker(brokerUri, resourceId) {
        return new Promise(function (resolve) {
            let params = {
                "brokerUri": brokerUri,
                "resourceId": resourceId
            };
            restUtils.call("POST", "/api/ui/broker/delete/resource", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in deleteResourceAtBroker(): ", error);
                resolve(error);
            });
        });
    },

    async getBrokers() {
        let brokers = await restUtils.call("GET", "/api/ui/brokers");
        return brokers;
    },

    async getBackendConnections() {
        backendConnections = [];
        let genericEndpoints = await restUtils.call("GET", "/api/ui/generic/endpoints");
        for (let genericEndpoint of genericEndpoints) {
            backendConnections.push(this.genericEndpointToBackendConnection(genericEndpoint));
        }
        return backendConnections;
    },

    genericEndpointToBackendConnection(genericEndpoint) {
        return {
            id: genericEndpoint["@id"],
            endpoint: genericEndpoint,
            url: genericEndpoint["ids:accessURL"] ? genericEndpoint["ids:accessURL"]["@id"] : "http://"
        };
    },

    async createBroker(url, title, vueRoot) {
        try {
            let params = {
                "brokerUri": url,
                "title": title
            };
            await restUtils.call("POST", "/api/ui/broker", params);
        } catch (error) {
            console.log("Error on API call: ", error.details);
            vueRoot.$emit('error', "Create broker failed.");
        }
    },

    async updateBroker(url, title, vueRoot) {
        try {
            let params = {
                "brokerUri": url,
                "title": title
            };
            await restUtils.call("PUT", "/api/ui/broker", params);
            await this.registerConnectorAtBroker(url);
        } catch (error) {
            console.log("Error on API call: ", error.details);
            vueRoot.$emit('error', "Update broker failed.");
        }
    },

    deleteBroker(brokerId) {
        return new Promise(function (resolve) {
            let params = {
                "brokerUri": brokerId
            };
            restUtils.call("DELETE", "/api/ui/broker", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in deleteBroker(): ", error);
                resolve(error);
            });
        });
    },

    createBackendConnection(url, username, password, sourceType) {
        return new Promise(function (resolve) {
            let params = {
                "accessURL": url,
                "username": username,
                "password": password,
                "sourceType": sourceType
            };
            restUtils.call("POST", "/api/ui/generic/endpoint", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in saveBackendConnection(): ", error);
                resolve(error);
            });
        });
    },

    updateBackendConnection(id, url, username, password, sourceType) {
        return new Promise(function (resolve) {
            let params = {
                "id": id,
                "accessURL": url,
                "username": username,
                "password": password,
                "sourceType": sourceType
            };
            restUtils.call("PUT", "/api/ui/generic/endpoint", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in saveBackendConnection(): ", error);
                resolve(error);
            });
        });
    },

    async deleteResource(id) {
        let response = (await restUtils.callConnector("DELETE", "/api/offers/" + id));
        return response;
    },

    getRoute(id) {
        return new Promise(function (resolve) {
            let params = {
                "routeId": id
            };
            restUtils.call("GET", "/api/ui/approute", params).then(response => {
                resolve(response.data)
            }).catch(error => {
                console.log("Error in getRoute(): ", error);
                resolve(error);
            });
        });
    },

    deleteRoute(id) {
        return new Promise(function (resolve) {
            let params = {
                "routeId": id
            };
            restUtils.call("DELETE", "/api/ui/approute", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log(error);
                resolve(error);
            });
        });
    },

    deleteBackendConnection(id) {
        return new Promise(function (resolve) {
            let params = {
                "endpointId": id
            };
            restUtils.call("DELETE", "/api/ui/generic/endpoint", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in deleteBackendConnection(): ", error);
                resolve(error);
            });
        });
    },

    getApps() {
        return new Promise(function (resolve) {
            apps = [];
            restUtils.call("GET", "/api/ui/apps").then(response => {
                let appsResponse = response.data;
                for (let app of appsResponse) {
                    apps.push(app[1]);
                }
                resolve(apps);
            }).catch(error => {
                console.log("Error in getApps(): ", error);
                resolve(error);
            });
        });
    },

    getEndpointList(node, endpointType) {
        let endpointList = [];
        if (node.type == "backendnode") {
            let endpoint = this.getBackendConnection(node.objectId).endpoint;
            endpointList.push(endpoint);
        } else if (node.type == "appnode") {
            let appEndpoints = this.getApp(node.objectId).appEndpointList[1];
            for (let appEndpoint of appEndpoints) {
                if (appEndpoint[1].endpoint["ids:appEndpointType"]["@id"] == endpointType) {
                    endpointList.push(appEndpoint[1].endpoint);
                }
            }
        }
        return endpointList;
    },

    getBackendConnection(id) {
        let result = null;
        for (let backendConnection of backendConnections) {
            if (id == backendConnection.id) {
                result = backendConnection;
                break;
            }
        }
        if (result == null) {
            console.log("Backend connection with ID ", id, " not found.");
        }
        return result;
    },

    getApp(id) {
        let result = null;
        for (let app of apps) {
            if (id == app.id) {
                result = app;
                break;
            }
        }
        return result;
    },

    getAppIdOfEndpointId(endpointId) {
        let result = null;
        for (let app of apps) {
            for (let appEndpoint of app.appEndpointList[1]) {
                if (endpointId == appEndpoint[1].endpoint["@id"]) {
                    result = app.id;
                    break;
                }
            }
        }
        return result;
    },

    getNode(id, nodes) {
        let node = null;
        for (let n of nodes) {
            if (n.id == id) {
                node = n;
                break;
            }
        }
        return node;
    },

    getNodeIdByObjectId(endpointId, nodes) {
        let nodeId = null;
        for (let n of nodes) {
            if (n.objectId == endpointId) {
                nodeId = n.id;
                break;
            }
        }
        return nodeId;
    },

    getCurrentDate() {
        return moment().format("YYYY-MM-DD");
    },

    async getConnectorAddress() {
        let address = "";
        if (connectorAddress == null) {
            let response = (await restUtils.call("GET", "/api/ui/configmodel")).data;
            if (response["ids:connectorDescription"] !== undefined && response["ids:connectorDescription"]["ids:hasDefaultEndpoint"] !== undefined
                && response["ids:connectorDescription"]["ids:hasDefaultEndpoint"]["ids:accessURL"] !== undefined) {
                address = response["ids:connectorDescription"]["ids:hasDefaultEndpoint"]["ids:accessURL"]["@id"].replace("/api/ids/data", "");
                connectorAddress = address;
            }
        } else {
            address = connectorAddress;
        }
        return address;
    },

    async createConnectorEndpoint(resourceUUID) {
        let connectorAddress = (await this.getConnectorAddress());
        let accessUrl = connectorAddress + "/admin/api/resources/" + resourceUUID + "/data";
        return new Promise(function (resolve) {
            let params = {
                "accessUrl": accessUrl
            }
            restUtils.call("POST", "/api/ui/connector/endpoint", params).then((response) => {
                resolve(response.data.connectorEndpointId);
            }).catch(error => {
                console.log("Error in createConnectorEndpoint(): ", error);
                resolve(error);
            });
        });
    },

    getIdOfConnectorResponse(response) {
        let url = response._links.self.href;
        return url.substring(url.lastIndexOf("/") + 1, url.length);
    },

    async createResource(title, description, language, keyword, version, standardlicense, publisher, pattern, contractJson,
        filetype, bytesize, brokerUris, genericEndpointId, vueRoot) {
        try {
            // TODO Sovereign, EndpointDocumentation
            let response = (await restUtils.callConnector("POST", "/api/offers", null, {
                "title": title,
                "description": description,
                "keywords": keyword,
                "publisher": publisher,
                "language": language,
                "licence": standardlicense
            }));

            let resourceUUID = response.connectorResponse;
            let resourceId = this.getIdOfConnectorResponse(response);
            response = (await restUtils.callConnector("POST", "/api/contracts", null, {}));

            let contractId = this.getIdOfConnectorResponse(response);
            // TODO use correct rule from UI
            response = (await restUtils.callConnector("POST", "/api/rules", null, {
                "title": "Provide Access",
                "value": "{\"@type\":\"ids:Permission\",\"@id\":\"https://w3id.org/idsa/autogen/permission/a2107dd7-a2bc-4037-a17e-ffbe9f28cbf0\",\"ids:target\":null,\"ids:description\":[{\"@value\":\"provide-access\",\"@type\":\"http://www.w3.org/2001/XMLSchema#string\"}],\"ids:title\":[{\"@value\":\"Allow Data Usage\",\"@type\":\"http://www.w3.org/2001/XMLSchema#string\"}],\"ids:preDuty\":null,\"ids:constraint\":null,\"ids:assetRefinement\":null,\"ids:postDuty\":null,\"ids:action\":[{\"properties\":null,\"@id\":\"idsc:USE\"}],\"ids:assignee\":null,\"ids:assigner\":null}"
            }));

            let ruleId = this.getIdOfConnectorResponse(response);
            response = (await restUtils.callConnector("POST", "/api/offers/" + resourceId + "/contracts", null, [contractId]));

            response = (await restUtils.callConnector("POST", "/api/contracts/" + contractId + "/rules", null, [ruleId]));

            response = (await restUtils.callConnector("POST", "/api/representations", null, {
                "language": language,
                "mediaType": filetype,
            }));

            let representationId = this.getIdOfConnectorResponse(response);
            response = (await restUtils.callConnector("POST", "/api/offers/" + resourceId + "/representations", null, [representationId]));

            response = (await this.createConnectorEndpoint(resourceUUID));
            let endpointId = response;
            response = (await this.createNewRoute(this.getCurrentDate() + " - " + title));
            let routeId = response;
            response = (await this.createSubRoute(routeId, genericEndpointId, 20, 150,
                endpointId, 220, 150, resourceId));

            await this.updateResourceAtBrokers(brokerUris, resourceId);

        } catch (error) {
            console.log("Error on API call: ", error.details);
            vueRoot.$emit('error', "Save resource failed.");
        }
    },

    async editResource(resourceId, representationId, title, description, language, keyword, version, standardlicense, publisher, pattern, contractJson,
        filetype, bytesize, brokerUris, brokerDeleteUris, genericEndpointId, vueRoot) {
        try {
            let params = {
                "resourceId": resourceId,
                "title": title,
                "description": description,
                "language": language,
                "keyword": keyword,
                "version": version,
                "standardlicense": standardlicense,
                "publisher": publisher
            }

            await restUtils.call("PUT", "/api/ui/resource", params);

            params = {
                "resourceId": resourceId,
                "pattern": pattern
            }
            await restUtils.call("PUT", "/api/ui/resource/contract/update", params, contractJson);

            // TODO remove sourceType when API changed.
            params = {
                "resourceId": resourceId,
                "representationId": representationId,
                "endpointId": genericEndpointId,
                "language": language,
                "filenameExtension": filetype,
                "bytesize": bytesize,
                "sourceType": "LOCAL"
            }
            await restUtils.call("PUT", "/api/ui/resource/representation", params);

            await this.updateResourceBrokerRegistration(brokerUris, brokerDeleteUris, resourceId);
        } catch (error) {
            console.log("Error on API call: ", error.details);
            vueRoot.$emit('error', "Save resource failed.");
        }
    },

    async updateResourceBrokerRegistration(brokerUris, brokerDeleteUris, resourceId) {
        for (let brokerUri of brokerUris) {
            await this.updateResourceAtBroker(brokerUri, resourceId);
        }
        for (let brokerUri of brokerDeleteUris) {
            await this.deleteResourceAtBroker(brokerUri, resourceId);
        }
    },

    async createResourceIdsEndpointAndAddSubRoute(title, description, language, keyword, version, standardlicense,
        publisher, pattern, contractJson, filetype, bytesize, brokerUris, genericEndpointId, routeId, startId, startCoordinateX,
        startCoordinateY, endCoordinateX, endCoordinateY, vueRoot) {
        let hasError = false;
        try {
            let params = {
                "title": title,
                "description": description,
                "language": language,
                "keyword": keyword,
                "version": version,
                "standardlicense": standardlicense,
                "publisher": publisher
            };
            let response = (await restUtils.call("POST", "/api/ui/resource", params));

            let resourceUUID = response.data.connectorResponse;
            let resourceId = response.data.resourceID;
            params = {
                "resourceId": resourceId,
                "pattern": pattern
            };
            response = (await restUtils.call("PUT", "/api/ui/resource/contract/update", params, contractJson));
            // TODO remove sourceType when API changed.
            params = {
                "resourceId": resourceId,
                "endpointId": genericEndpointId,
                "language": language,
                "sourceType": "LOCAL",
                "filenameExtension": filetype,
                "bytesize": bytesize
            };
            response = (await restUtils.call("POST", "/api/ui/resource/representation", params));

            let endpointId = (await this.createConnectorEndpoint(resourceUUID));
            response = await this.createSubRoute(routeId, startId, startCoordinateX, startCoordinateY,
                endpointId, endCoordinateX, endCoordinateY, resourceId);

            await this.updateResourceAtBrokers(brokerUris, resourceId);
        } catch (error) {
            hasError = true;
            console.log("Error on API call: ", error.details);
            vueRoot.$emit('error', "Create IDS endpoint failed.");
        }

        return hasError;
    },

    async updateResourceAtBrokers(brokerUris, resourceId) {
        for (let brokerUri of brokerUris) {
            await this.updateResourceAtBroker(brokerUri, resourceId);
        }
    },

    getEndpointInfo(routeId, endpointId) {
        return new Promise(function (resolve) {
            let params = {
                "routeId": routeId,
                "endpointId": endpointId
            }
            restUtils.call("GET", "/api/ui/approute/step/endpoint/info", params).then(response => {
                resolve(response.data)
            }).catch(error => {
                console.log("Error in getEndpointInfo(): ", error);
                resolve(error);
            });
        });
    },

    getRoutes() {
        return new Promise(function (resolve) {
            restUtils.call("GET", "/api/ui/approutes").then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in getRoutes(): ", error);
                resolve(error);
            });
        });
    },

    createNewRoute(description) {
        return new Promise(function (resolve) {
            let params = {
                "description": description
            }
            restUtils.call("POST", "/api/ui/approute", params).then(response => {
                resolve(response.data.id);
            }).catch(error => {
                console.log("Error in createNewRoute(): ", error);
                resolve(error);
            });
        });
    },

    createSubRoute(routeId, startId, startCoordinateX, startCoordinateY, endId, endCoordinateX, endCoordinateY, resourceId) {
        return new Promise(function (resolve) {
            let params = {
                "routeId": routeId,
                "startId": startId,
                "startCoordinateX": startCoordinateX,
                "startCoordinateY": startCoordinateY,
                "endId": endId,
                "endCoordinateX": endCoordinateX,
                "endCoordinateY": endCoordinateY,
                "resourceId": resourceId
            }
            restUtils.call("POST", "/api/ui/approute/step", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in createSubRoute(): ", error);
                resolve(error);
            });
        });

    },

    async getDeployMethods() {
        let response = await restUtils.call("GET", "/api/ui/enum/deployMethod");
        return response;

    },

    async getDeployMethod() {
        let response = await restUtils.call("GET", "/api/ui/route/deploymethod");
        return response;
    },

    changeDeployMethod(deployMethod) {
        return new Promise(function (resolve) {
            let params = {
                "deployMethod": deployMethod
            };
            restUtils.call("PUT", "/api/ui/route/deploymethod", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in changeDeployMethod(): ", error);
                resolve(error);
            });
        });
    },

    async getLogLevels() {
        let response = await restUtils.call("GET", "/api/ui/enum/logLevel");
        return response;
    },

    getConfigModel() {
        return new Promise(function (resolve) {
            restUtils.call("GET", "/api/ui/configmodel").then((response) => {
                resolve(clientDataModel.convertIdsConfigModel(response.data));
            }).catch(error => {
                console.log("Error in getConfigModel(): ", error);
                resolve(error);
            });
        });
    },

    changeConfigModel(logLevel, connectorDeployMode,
        trustStoreUrl, trustStorePassword, keyStoreUrl, keyStorePassword, proxyUrl, proxyNoProxy, username, password) {
        return new Promise(function (resolve) {
            let params = {
                "loglevel": logLevel,
                "connectorDeployMode": connectorDeployMode,
                "trustStore": trustStoreUrl,
                "trustStorePassword": trustStorePassword,
                "keyStore": keyStoreUrl,
                "keyStorePassword": keyStorePassword,
                "proxyUri": proxyUrl,
                "noProxyUri": proxyNoProxy,
                "username": username,
                "password": password
            };
            restUtils.call("PUT", "/api/ui/configmodel", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in changeConfigModel(): ", error);
                resolve(error);
            });
        });
    },

    async getConnectorSettings() {
        let response = await restUtils.callConnector("GET", "/api/configuration");
        console.log("CONN SETTINGS: ", response);
        return clientDataModel.convertIdsConnector(response);
    },

    changeConnectorSettings(connectorTitle, connectorDescription,
        connectorEndpoint, connectorVersion, connectorCurator,
        connectorMaintainer, connectorInboundModelVersion, connectorOutboundModelVersion) {
        return new Promise(function (resolve) {
            let params = {
                "title": connectorTitle,
                "description": connectorDescription,
                "version": connectorVersion,
                "curator": connectorCurator,
                "endpoint": connectorEndpoint,
                "maintainer": connectorMaintainer,
                "inboundModelVersion": connectorInboundModelVersion,
                "outboundModelVersion": connectorOutboundModelVersion
            };
            restUtils.call("PUT", "/api/ui/connector", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in changeConnectorSettings(): ", error);
                resolve(error);
            });
        });
    },

    async getConnectorDeployModes() {
        let response = await restUtils.call("GET", "/api/ui/enum/connectorDeployMode");
        return response;
    },

    receiveResources(recipientId) {
        return new Promise(function (resolve) {
            let params = {
                "recipientId": recipientId
            }
            restUtils.call("POST", "/api/ui/request/description", params).then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log("Error in receiveResources(): ", error);
                resolve(error);
            });
        });
    },

    receiveResource(recipientId, requestedResourceId) {
        return new Promise(function (resolve) {
            let params = {
                "recipientId": recipientId,
                "requestedResourceId": requestedResourceId
            };
            restUtils.call("POST", "/api/ui/request/description", params).then(response => {
                resolve(clientDataModel.convertIdsResource(response.data));
            }).catch(error => {
                console.log("Error in receiveResource(): ", error);
                resolve(error);
            });
        });
    }
}
