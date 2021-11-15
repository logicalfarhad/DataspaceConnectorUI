/* eslint-disable no-unused-vars */
import {
    VContainer,
    VSelect,
    VIcon,
    VStepper,
    VStepperStep,
    VStepperHeader,
    VStepperContent,
    VStepperItems,
    VCard,
    VCardTitle,
    VTextField,
    VDivider,
    VCol,
    VRow,
    VDialog,
    VCardActions,
    VSpacer,
    VCardText
} from "vuetify/lib";
import FileUpload from '@/components/fileupload/FileUpload.vue'
import dataUtils from "@/utils/dataUtils";
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
        VStepperHeader,
        VSelect,
        VIcon,
        VContainer,
        VTextField,
        VCol,
        VRow,
        VDialog,
        VCardActions,
        VSpacer,
        VCardText
    },
    data() {
        return {
            e1: 1,
            dialog: false,
            title: "Configure Item",
            editedItem: {
                name: '',
                calories: 0,
                fat: 0,
                carbs: 0,
                protein: 0,
            },
            cSel: ['String', 'Integer', 'Decimal', 'Date/Time', 'Ordinal'],
            dSel: ['Generalization', 'Microaggregation', 'Clustering and microaggregation'],
            eSel: ['Insensitive', 'Sensitive', 'Quasi-identifying', 'Identifying'],
            items: [],
            headers: [
                { text: 'Attribute', value: 'columnName' },
                { text: 'Data Type', value: 'data_type', width: '200' },
                { text: 'Type', value: 'attr_type', width: '200' },
                { text: 'Transformation', value: 'transform_type', width: '200' },
                { text: "Actions", value: "actions" }
            ],
        };
    },

    watch: {
        async e1() {
            if (this.e1 === 2) {
                this.items = [];
                let _items = await this.getHeaders();
                let _headers = _items.shift();
                let headers = [..._headers.split(';')];
                headers.map((item) => {
                    let column = {
                        columnName: item,
                        attr_type: 'Insensitive',
                        transform_type: 'Generalization',
                        data_type: 'String',

                    };
                    this.items.push(column);
                });
            }
        },
    },
    methods: {
        async getHeaders() {
            return await dataUtils.preview()
        },
        async getitemlist() {
            return await dataUtils.getallitemsfromcsv()
        },
        editItem(item) {
            console.log(item);
        },
        configureItem(item) {
            this.editedItem = Object.assign({}, item)
            this.dialog = true
        }
        , save() { },
        close() { 
            this.dialog = false
        },
    },

    mounted() {
    },
};