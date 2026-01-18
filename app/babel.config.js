module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset', // Vue CLI's default Babel preset
  ],
  plugins: [
    '@babel/plugin-proposal-numeric-separator',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
  ],
};