module.exports = function(config) {
  config.set({
    frameworks: ["jasmine", "karma-typescript"],
    browsers: ["ChromeHeadless"],
    reporters: ["progress", "karma-typescript"],
    files: ["./cacheable.decorator.ts", "./cacheable.decorator.spec.ts"],
    preprocessors: {
      "**/*.ts": "karma-typescript"
    },
    karmaTypescriptConfig: {
      tsconfig: "./tsconfig.json"
    }
  });
};