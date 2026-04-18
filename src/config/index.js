// 主要用于在不同环境（开发、测试、生产）下切换 API 地址等配置
const Env = import.meta.env.MODE || "development";
const EnvConfig = {
  // 开发环境
  development: {
    baseApi: "http://localhost:3000",
  },
  //   test: {
  //     api: "http://localhost:3000",
  //   },
};

export default EnvConfig[Env];
