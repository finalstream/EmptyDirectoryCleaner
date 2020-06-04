module.exports = {
  // debug
  configureWebpack: {
    devtool: "source-map",
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: "net.finalstream.emptydirectorycleaner",
        productName: "Empty Directory Cleaner",
        win: {
          icon: "./edc.png",
        },
      },
    },
  },
};
