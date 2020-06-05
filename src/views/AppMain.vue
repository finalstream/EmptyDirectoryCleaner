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
        :disabled="disabledSearch"
        >Search</el-button
      >
    </div>
    <div>
      <el-table
        :data="mainData.directories"
        style="margin-top:20px;width: 100%;height: calc(100vh - 225px); overflow: auto;"
        empty-text=" "
      >
        <el-table-column width="50">
          <template slot="header" slot-scope="{}">
            <!-- eslint-disable-line -->
            <el-checkbox v-model="isAllSelected" :indeterminate="isIndeterminateCheckbox" />
          </template>
          <template slot-scope="props">
            <el-checkbox v-model="props.row.isSelected" @change="checkChanged()" />
          </template>
        </el-table-column>

        <el-table-column label="name" prop="name" />
      </el-table>
    </div>
    <el-button
      :type="deleteButtonType"
      style="margin-top:15px;width:100%"
      @click="isVisibleConfirmDialog = true"
      v-loading.fullscreen.lock="isLoading"
      :disabled="disabledDelete"
      >Delete Selected {{ this.selectItemsCount }} items</el-button
    >
    <!--
    <el-row type="flex">
      <el-col><el-input prefix-icon="el-icon-date" v-model="input1"/></el-col>
      <el-col><el-button>参照</el-button></el-col>
    </el-row>
    -->
    <el-dialog title :visible.sync="isVisibleConfirmDialog" width="60%" center>
      <template slot="title">
        <i class="el-icon-warning-outline" style="color:#f56c6c"></i>
        <span style="color:#f56c6c">Warning</span>
      </template>
      <span>Are you sure you want to delete the selected empty directory?</span>
      <br />
      <span>The deleted directory will be moved to the trash.</span>
      <span slot="footer" class="dialog-footer">
        <el-button type="danger" @click="deleteDirectory()">Yes</el-button>
        <el-button style="margin-left:50px" @click="isVisibleConfirmDialog = false">No</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";

// @ is an alias to /src
import MainData from "../models/MainData";
import electron from "electron";

@Component
export default class AppMain extends Vue {
  mainData: MainData;
  isLoading: boolean;
  isAllSelected: boolean;
  isVisibleConfirmDialog: boolean;
  isIndeterminateCheckbox: boolean;

  private ipcRenderer = electron.ipcRenderer;

  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.mainData = new MainData();
    this.isLoading = false;
    this.isAllSelected = true;
    this.isVisibleConfirmDialog = false;
    this.isIndeterminateCheckbox = false;
  }

  created() {
    console.log("created");
    //this.mainData = new Store().get("mainData");
    this.ipcRenderer.invoke("getStore", "searchDirectory").then(res => {
      if (res) this.mainData.searchDirectory = res;
    });
  }

  mounted() {
    this.ipcRenderer.invoke("ready");
  }

  search() {
    console.log("search!" + this.mainData.searchDirectory);
    //new Store().set("mainData", this.mainData.searchDir);
    this.isLoading = true;
    this.mainData.clearDirectories();
    this.ipcRenderer.invoke("searchDirectory", this.mainData.searchDirectory).then(directories => {
      this.mainData.updateDirectories(directories);
      this.isAllSelected = true;
      this.isIndeterminateCheckbox = false;
      this.isLoading = false;
    });
  }

  selectDir() {
    this.ipcRenderer.invoke("openDialogDirectory").then(path => {
      if (path != "") this.mainData.searchDirectory = path;
    });
  }

  deleteDirectory() {
    this.isVisibleConfirmDialog = false;
    this.isLoading = true;

    this.ipcRenderer
      .invoke(
        "deleteDirectory",
        this.mainData.searchDirectory,
        this.mainData.directories.filter(d => d.isSelected).map(d => d.name)
      )
      .then((deleteDirectories: string[]) => {
        // 一致したものを削除
        this.mainData.directories = this.mainData.directories.filter(
          d => !deleteDirectories.includes(d.name)
        );
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const t: any = this;
        t.$message({
          type: "success",
          message: "Delete completed",
        });
        this.isLoading = false;
      });
  }

  checkChanged() {
    const selectedCount = this.mainData.directories.filter(d => d.isSelected).length;
    this.isIndeterminateCheckbox =
      selectedCount > 0 && selectedCount < this.mainData.directories.length;
  }

  @Watch("isAllSelected")
  onChangeIsAllSelected() {
    let selected = false;
    if (this.isAllSelected) {
      selected = true;
    }
    this.mainData.directories.forEach(d => {
      d.isSelected = selected;
    });
    this.checkChanged();
  }

  get selectItemsCount() {
    return this.mainData.directories.filter(d => d.isSelected).length;
  }

  get disabledDelete() {
    return this.mainData.directories.filter(d => d.isSelected).length == 0;
  }

  get deleteButtonType() {
    return this.mainData.directories.filter(d => d.isSelected).length == 0 ? "info" : "warning";
  }

  get disabledSearch() {
    return this.mainData.searchDirectory == "";
  }
}
</script>
