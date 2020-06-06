<template>
  <div class="main">
    <div style="display: inline-flex;width:100%">
      <el-input
        prefix-icon="el-icon-folder"
        @select="selectDir()"
        v-model="mainData.searchDirectory"
      />
      <el-button style="margin-left:10px" @click="selectDir()">...</el-button>
    </div>
    <div>
      <el-button
        type="primary"
        style="margin-top:10px;width:100%"
        @click="search()"
        v-loading.fullscreen.lock="isLoading"
        :disabled="disabledSearchButton"
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
      :disabled="disabledDeleteButton"
      >Delete Selected {{ this.selectItemsCount }} directories</el-button
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
import { Dirent } from "fs";
import IpcResponse from "../models/IpcResponse";
import CommonVue from "../models/CommonVue";
import { MessageLevel } from "../models/MessageLevel";

@Component
export default class AppMain extends CommonVue {
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
    this.isAllSelected = false;
    this.isVisibleConfirmDialog = false;
    this.isIndeterminateCheckbox = false;
  }

  async created() {
    const res = await this.ipcRenderer.invoke("getStore", "searchDirectory");
    if (res) this.mainData.searchDirectory = res;
  }

  mounted() {
    this.ipcRenderer.invoke("ready");
  }

  async search() {
    try {
      this.isLoading = true;
      this.mainData.clearDirectories();
      const response: IpcResponse<Dirent[]> = await this.ipcRenderer.invoke(
        "searchDirectory",
        this.mainData.searchDirectory
      );
      if (response.error) {
        this.showMessage(MessageLevel.Warning, "Directory does not exist");
        return;
      }
      this.mainData.updateDirectories(response.result);
      this.isAllSelected = true;
      this.isIndeterminateCheckbox = false;
    } finally {
      this.isLoading = false;
    }
  }

  async selectDir() {
    const path = await this.ipcRenderer.invoke("openDialogDirectory");
    if (path == undefined) return;
    this.mainData.searchDirectory = path;
  }

  async deleteDirectory() {
    this.isVisibleConfirmDialog = false;
    this.isLoading = true;

    const deleteDirectories: string[] = await this.ipcRenderer.invoke(
      "deleteDirectory",
      this.mainData.searchDirectory,
      this.mainData.directories.filter(d => d.isSelected).map(d => d.name)
    );
    // 一致したものを削除
    this.mainData.directories = this.mainData.directories.filter(
      d => !deleteDirectories.includes(d.name)
    );

    if (this.mainData.directories.filter(d => d.isSelected).length == 0) {
      this.showMessage(MessageLevel.Success, "Delete completed");
    } else if (deleteDirectories.length == 0) {
      // TODO: ログを出力する
      this.showMessage(MessageLevel.Error, "Delete Error.");
    } else {
      this.showMessage(MessageLevel.Warning, "Delete Partially completed");
    }
    this.isLoading = false;
  }

  checkChanged() {
    // 一部チェックの状態を設定
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

  get disabledDeleteButton() {
    return this.mainData.directories.filter(d => d.isSelected).length == 0;
  }

  get deleteButtonType() {
    return this.mainData.directories.filter(d => d.isSelected).length == 0 ? "info" : "warning";
  }

  get disabledSearchButton() {
    return this.mainData.searchDirectory == "";
  }
}
</script>
<style>
.el-loading-mask {
  background-color: rgba(0, 0, 0, 0.5) !important;
}
</style>
