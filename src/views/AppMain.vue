<template>
  <div class="main">
    <div style="display: inline-flex;width:100%">
      <el-input
        prefix-icon="el-icon-folder"
        @select="selectDir()"
        v-model="mainData.searchDirectory"
        readonly
      />
      <el-button style="margin-left:10px" @click="selectDir()">...</el-button>
    </div>
    <div>
      <el-button
        type="primary"
        style="margin-top:10px;width:100%"
        @click="search()"
        v-loading.fullscreen.lock="isLoading"
        >Search</el-button
      >
    </div>
    <div>
      <el-table :data="mainData.directories" style="width: 100%" empty-text=" ">
        <el-table-column prop="name" />
      </el-table>
    </div>

    <!--
    <el-row type="flex">
      <el-col><el-input prefix-icon="el-icon-date" v-model="input1"/></el-col>
      <el-col><el-button>参照</el-button></el-col>
    </el-row>
    -->
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";
import MainData from "../models/MainData";
import AppStore from "../models/AppStore";
import electron from "electron";

@Component
export default class AppMain extends Vue {
  mainData: MainData;
  isLoading: boolean;

  private ipcRenderer = electron.ipcRenderer;

  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.mainData = new MainData();
    this.isLoading = false;
  }

  created() {
    console.log("created");
    //this.mainData = new Store().get("mainData");
    this.ipcRenderer.invoke("getStore", "searchDirectory").then(res => {
      if (res) this.mainData.searchDirectory = res;
    });
  }

  async search() {
    console.log("search!" + this.mainData.searchDirectory);
    //new Store().set("mainData", this.mainData.searchDir);
    this.isLoading = true;
    this.mainData.clearDirectories();
    await this.ipcRenderer
      .invoke("searchDirectory", this.mainData.searchDirectory)
      .then(directories => {
        this.mainData.updateDirectories(directories);
        this.isLoading = false;
      });
  }

  async selectDir() {
    await this.ipcRenderer.invoke("openDialogDirectory").then(path => {
      if (path != "") this.mainData.searchDirectory = path;
    });
  }
}
</script>
