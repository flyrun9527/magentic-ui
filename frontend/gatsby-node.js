exports.onCreateWebpackConfig = ({ actions, stage }) => {
  actions.setWebpackConfig({
    resolve: {
      fallback: {
        canvas: false,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        assert: false,
        url: false,
        http: false,
        https: false,
        zlib: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
  });

  // Fix SSR issues with browser-only code
  if (stage === "build-html" || stage === "develop-html") {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /react-pdf-highlighter/,
            use: "null-loader",
          },
          {
            test: /pdfjs-dist/,
            use: "null-loader",
          },
        ],
      },
    });
  }
};
