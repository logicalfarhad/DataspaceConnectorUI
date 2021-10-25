import { VStepper, VStepperStep, VStepperHeader, VStepperContent, VStepperItems, VCard, VCardTitle, VDivider } from "vuetify/lib";
import FileUpload from '@/components/fileupload/FileUpload.vue'
import axios from "axios";
export default {
    components: {
        FileUpload,
        VStepper,
        VStepperStep,
        VStepperContent,
        VStepperItems,
        VCardTitle,
        VCard,
        VDivider,
        VStepperHeader
    },
    data() {
        return {
            e1: 1,
            page: 0,
            totalPassengers: 0,
            numberOfPages: 0,
            passengers: [],
            loading: true,
            options: {
                page: 0,
                itemsPerPage: 5
            },
            headers: [
                { text: "Passenger Name", value: "name" },
                { text: "Number Of Trips", value: "trips" },
                { text: "Airline", value: "airline[0].name" },
                { text: "Logo", value: "airline[0].logo" },
                { text: "Website", value: "airline[0].website" },
            ],
        };
    },
    //this one will populate new data set when user changes current page. 
    watch: {
        options: {
            handler() {
                this.readDataFromAPI();
            },
        },
        deep: true,
    },
    methods: {
        //Reading data from API method. 
        async readDataFromAPI() {
            this.loading = true;
            const { page, itemsPerPage } = this.options;
            let pageNumber = page;
            let response = await axios.get(`https://api.instantwebtools.net/v1/passenger?size=${itemsPerPage}&page=${pageNumber}`);
            //Then injecting the result to datatable parameters.
            this.loading = false;
            this.passengers = response.data.data;
            this.totalPassengers = response.data.totalPassengers;
            this.numberOfPages = response.data.totalPages;
        },
    },
    //this will trigger in the onReady State
    mounted() {
        this.readDataFromAPI();
    },
};