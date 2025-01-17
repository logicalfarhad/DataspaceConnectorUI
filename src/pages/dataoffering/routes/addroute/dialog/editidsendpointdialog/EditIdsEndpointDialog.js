import AddResourcePage from "@/pages/dataoffering/resources/addresource/AddResourcePage.vue";
import clientDataModel from "@/datamodel/clientDataModel";

export default {
    components: {
        AddResourcePage
    },
    data() {
        return {
            title: "",
            dialog: false,
            nodeType: "",
            search: '',
            valid: false,
            itemKey: "id",
            headers: [],
            selected: [],
            items: [],
            node: null,
            isNewNode: true,
        };
    },
    watch: {
        selected: function () {
            this.$data.valid = this.$data.selected.length > 0;
        }
    },
    mounted: function () { },
    methods: {
        show(node) {
            this.$data.node = node;
            let resource;
            if (node == null) {
                this.$data.title = "Add IDS Endpoint";
                resource = clientDataModel.createResource("", -1);
            } else {
                this.$data.title = "Edit IDS Endpoint";
                resource = node.resource;
            }

            this.$refs.addResourcePage.set(resource, false);
            this.$data.dialog = true;
        },
        saved(catalogIds, title, description, language, paymentMethod, keywords, version, standardlicense, publisher, policyDescriptions, filetype, bytesize, brokerList) {
            let isNew = false;
            if (this.$data.node == null) {
                isNew = true;
                this.$data.node = {
                    id: +new Date(),
                    x: 0,
                    y: 0,
                    name: 'IDS Endpoint',
                    type: 'idsendpointnode',
                    text: "IDS Endpoint",
                    objectId: null,
                };

            }

            let resource = {};
            resource.catalogIds = catalogIds;
            resource.title = title;
            resource.description = description;
            resource.language = language;
            resource.paymentMethod = paymentMethod;
            resource.keywords = keywords;
            resource.version = version;
            resource.standardlicense = standardlicense;
            resource.publisher = publisher;
            resource.policyDescriptions = policyDescriptions;
            resource.fileType = filetype;
            resource.bytesize = bytesize;
            resource.brokerUris = brokerList;
            this.$data.node.resource = resource;

            if (isNew) {
                this.$emit('newIdsEndpointNodeSaved', this.$data.node);
            }

            this.dialog = false;
        }
    }
};
