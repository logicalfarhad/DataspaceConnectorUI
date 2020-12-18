import Axios from "axios";

export default {
    components: {},
    data() {
        return {
            dialog: false,
            currentBroker: null,
            title: "",
            brokerTitle: null,
            url: null,
            valid: false,
            defaultRule: [
                v => !!v || 'This data is required'
            ],
            urlRule: [
                v => !!v || 'This data is required',
                v => /^[h][t][t][p][s]{0,1}[:][/][/].*$/.test(v) || 'Only URIs (http://... or https://...) allowed',
            ]
        };
    },
    mounted: function () {},
    methods: {
        addButtonClicked() {
            this.$data.title = "Add Broker";
            this.$data.brokerTitle = "";
            this.$data.url = "";
        },
        saveBroker() {
            if (this.$data.currentBroker == null) {
                this.$root.$emit('showBusyIndicator', true);
                this.$data.dialog = false;
                Axios.post("http://localhost:80/broker?brokerUri=" + this.$data.url + "&title=" +
                    this.$data.brokerTitle).then(() => {
                    Axios.post("http://localhost:80/broker/register?brokerUri=" + this.$data.url).then(() => {
                        this.$emit('brokerSaved');
                    }).catch(error => {
                        console.log("Error in saveBroker(): ", error);
                    });
                }).catch(error => {
                    console.log("Error in saveBroker(): ", error);
                });
            } else {
                this.$root.$emit('showBusyIndicator', true);
                this.$data.dialog = false;
                Axios.put("http://localhost:80/broker?brokerUri=" + this.$data.url + "&title=" + this.$data.brokerTitle).then(() => {
                    this.$emit('brokerSaved');
                }).catch(error => {
                    console.log("Error in saveBroker(): ", error);
                });
            }
        },
        edit(broker) {
            this.$data.title = "Edit Broker"
            this.$data.currentBroker = broker;
            this.$data.curator = broker["ids:curator"]["@id"];
            this.$data.maintainer = broker["ids:maintainer"]["@id"];
            this.$data.inboundModelVersion = broker["ids:inboundModelVersion"];
            this.$data.outboundModelVersion = broker["ids:outboundModelVersion"];
            this.$data.dialog = true;
        }
    }
}