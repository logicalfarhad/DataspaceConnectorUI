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
            >Save File</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col cols="auto">
      <v-card width="600" height="300" raised>
        <v-card-title>File contents:</v-card-title>
        <v-card-text
          ><p>{{ data }}</p>
        </v-card-text>
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
      data: "",
      selectedFile: null,
      isSelecting: false,
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
        let response = await dataUtils.upload(this.selectedFile);
        console.log(response);
      }
    },
  },
  computed: {
    
  },
};
</script>
