import dataUtils from "@/utils/dataUtils";
import errorUtils from "@/utils/errorUtils";
import ConfirmationDialog from "@/components/confirmationdialog/ConfirmationDialog.vue";
import ResourceDetailsDialog from "./resourcedetailsdialog/ResourceDetailsDialog.vue";
import ResourceReferenceDialog from "./resourcereferencedialog/ResourceReferenceDialog.vue";

export default {
    components: {
        ConfirmationDialog,
        ResourceDetailsDialog,
        ResourceReferenceDialog
    },
    data() {
        return {
            search: '',
            headers: [{
                text: 'Creation date',
                value: 'creationDate',
                width: 135
            }, {
                text: 'Title',
                value: 'title'
            },
            {
                text: 'Keywords',
                value: 'keywords'
            },
            {
                text: 'Brokers',
                value: 'brokerNames'
            },
            {
                text: '',
                value: 'actions',
                sortable: false,
                align: 'right',
                width: 170
            }
            ],
            resources: [],
            filteredResources: [],
            filterResourceType: null,
            fileTypes: ["All"],
            sortBy: 'creationDate',
            sortDesc: true,
        };
    },
    mounted: function () {
        this.getResources();
    },
    methods: {
        async getResources() {
            this.$root.$emit('showBusyIndicator', true);
            try {
                let response = await dataUtils.getResources();
                this.$data.resources = response;
                this.$data.fileTypes = ["All"];
                for (let resource of this.$data.resources) {
                    this.$data.fileTypes.push(resource.fileType);
                    let brokers = await dataUtils.getBrokersOfResource(resource.id);
                    resource.brokerNames = brokers.map(x => x.title);
                }
            } catch (error) {
                errorUtils.showError(error, "Get resources");
            }
            this.filterChanged();
            this.$forceUpdate();
            this.$root.$emit('showBusyIndicator', false);
        },
        filterChanged() {
            if (this.$data.filterResourceType == null | this.$data.filterResourceType == "All") {
                this.$data.filteredResources = this.$data.resources;
            } else {
                this.$data.filteredResources = [];
                for (var resource of this.$data.resources) {
                    if (resource.fileType == this.$data.filterResourceType) {
                        this.$data.filteredResources.push(resource);
                    }
                }
            }
        },
        deleteItem(item) {
            this.$refs.confirmationDialog.title = "Delete Resource";
            this.$refs.confirmationDialog.text = "Are you sure you want to delete the resource '" + item.title + "'?";
            this.$refs.confirmationDialog.callbackData = {
                item: item
            };
            this.$refs.confirmationDialog.callback = this.deleteCallback;
            this.$refs.confirmationDialog.dialog = true;
        },
        async deleteCallback(choice, callbackData) {
            if (choice == "yes") {
                let resourceId = callbackData.item.id;
                this.$root.$emit('showBusyIndicator', true);

                try {
                    await dataUtils.deleteResource(resourceId);
                } catch (error) {
                    errorUtils.showError(error, "Delete resource");
                }

                this.getResources();
                this.$root.$emit('showBusyIndicator', false);
            }
        },
        editItem(item) {
            this.$router.push('editresource?id=' + item.id);
        },
        editItemReferences(item) {
            this.$refs.resourceReferenceDialog.show(item.id);
        },
        showItem(item) {
            this.$refs.resourceDetailsDialog.show(item.id);
        }
    },
};
