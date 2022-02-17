import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  fastRefresh: {},
  electronBuilder: {
    builderOptions: {
      appId: 'com.eqy.sms.encoder',
      productName: '翼企云短信加密',
    },
  },
});
