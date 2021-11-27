/* eslint-disable no-unused-vars */
<template>
  <v-row justify="start">
    <v-col cols="auto">
      <v-card width="300" height="300" raised>
        <v-card-title>Please choose a csv file:</v-card-title>
        <br />
        <v-card-text>
          <v-file-input
            v-model="selectedFile"
            placeholder="Upload your file"
            prepend-icon="mdi-paperclip"
            show-size
            accept=".csv"
          >
            <template v-slot:selection="{ text }">
              <v-chip small label color="primary">
                {{ text }}
              </v-chip>
            </template>
          </v-file-input>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn right color="accent" elevation="2" @click="importTxt"
            >Save file</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col cols="auto">
      <v-card width="600" height="300" raised>
        <v-card-title>File contents:</v-card-title>
        <v-card-text>
          <v-simple-table fixed-header>
            <template v-slot:default>
              <thead v-if="data.length > 0">
                <tr>
                  <th
                    class="text-left"
                    v-for="(item, index) in headers"
                    :key="index"
                  >
                    {{ item }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in data" :key="index">
                  <td v-for="(itm, idx) in item" :key="idx">{{ itm }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-spacer></v-spacer>
          <v-btn right color="accent" elevation="2" @click="previewFile"
            >Preview</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>
<script>
import dataUtils from "@/utils/dataUtils";
export default {
  name: "file-upload",
  props: {},
  data() {
    return {
      data: [],
      selectedFile: null,
      isSelecting: false,
      headers: [],
    };
  },
  methods: {
    onButtonClick(event) {
      event.preventDefault();
      this.isSelecting = true;
      window.addEventListener(
        "focus",
        () => {
          this.isSelecting = false;
        },
        { once: true }
      );
      this.$refs.uploader.click();
    },
    onFileChanged(e) {
      this.selectedFile = e.target.files[0];
    },
    async importTxt() {
      if (this.selectedFile) {
        await dataUtils.upload(this.selectedFile);
        // console.log(response);
      }
    },

    async previewFile() {
      let response = await dataUtils.preview();
      this.headers = response[0].split(",");
      response.shift();
      this.data = response.map((item) => {
        return item.split(",");
      });
    },
  },
  computed: {},
};
</script>
