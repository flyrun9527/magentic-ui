exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  actions.setWebpackConfig({
    resolve: {
      fallback: {
        canvas: false,
        fs: false,
        path: false,
        os: false,
      },
    },
  });
}; 