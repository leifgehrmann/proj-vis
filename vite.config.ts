/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    projVisServerUrl: JSON.stringify(process.env.PROJ_VIS_SERVER_URL),
  },
});
