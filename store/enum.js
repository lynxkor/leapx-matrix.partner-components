const enumModule = {
  namespaced: true,
  state: {
    // 存储枚举数据，结构为 { [enumCode]: data }
    enums: {}
  },
  mutations: {
    /**
     * 设置枚举数据
     * @param {Object} state - 状态对象
     * @param {Object} payload - 载荷
     * @param {string} payload.code - 枚举代码
     * @param {Array|Object} payload.data - 枚举数据
     */
    SET_ENUM (state, { code, data }) {
      state.enums[code] = data;
    },

    /**
     * 清除指定枚举数据
     * @param {Object} state - 状态对象
     * @param {string} code - 枚举代码
     */
    CLEAR_ENUM (state, code) {
      delete state.enums[code];
    },

    /**
     * 清除所有枚举数据
     * @param {Object} state - 状态对象
     */
    CLEAR_ALL_ENUMS (state) {
      state.enums = {};
    }
  },
  actions: {
    /**
     * 设置枚举数据
     * @param {Object} context - 上下文对象
     * @param {Object} payload - 载荷
     * @param {string} payload.code - 枚举代码
     * @param {Array|Object} payload.data - 枚举数据
     */
    setEnum ({ commit }, { code, data }) {
      commit('SET_ENUM', { code, data });
    },

    /**
     * 清除指定枚举数据
     * @param {Object} context - 上下文对象
     * @param {string} code - 枚举代码
     */
    clearEnum ({ commit }, code) {
      commit('CLEAR_ENUM', code);
    },

    /**
     * 清除所有枚举数据
     * @param {Object} context - 上下文对象
     */
    clearAllEnums ({ commit }) {
      commit('CLEAR_ALL_ENUMS');
    }
  },
  getters: {
    /**
     * 获取枚举数据
     * @param {Object} state - 状态对象
     * @returns {Function} 返回根据枚举代码获取枚举数据的函数
     */
    getEnum: (state) => (code) => {
      return state.enums[code];
    },

    /**
     * 检查枚举是否存在
     * @param {Object} state - 状态对象
     * @returns {Function} 返回根据枚举代码检查枚举是否存在的函数
     */
    hasEnum: (state) => (code) => {
      return Object.prototype.hasOwnProperty.call(state.enums, code);
    }
  }
};

export default enumModule;
