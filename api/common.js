// 通用查询接口
import api from '../axios';

const prefix = '/datacenter/web/common/';

/**
 * 查询table配置
 * @param {Object} data
 */
export function getTableConfig (tableCode) {
  return api.get(prefix + 'userDefineTable/get', { tableCode });
};

/**
 * 新增或修改Table配置
 * @param {Object} data
 */
export function tableAddOrUpdate (data) {
  return api.jsonPost(prefix + 'userDefineTable/addOrUpdate', data);
}

/**
 * 列表下载模板
 * @param {*} data
 */
export function getTemplateUrl (data) {
  return api.jsonPost('/data/commonDataProcessExcelModelMap/get', data);
}

/**
 * 列表下载模板 code
 * @param {*} data
 */
export function getTemplateCode (data) {
  return api.jsonPost('/data/commonDataProcessExcelModelMap/code', data);
}

/**
 * 列表模板确认
 * @param {*} data
 */
export function importExcelConfirmFile (formData, config = {}) {
  const { businessParams, async, id, token, headers, ...restConfig } = config;
  // 动态构建 params 对象，使用解构和条件展开
  const params = {
    id,
    token,
    ...(async && { async }),
    ...(businessParams && { businessParams }) // 如果 businessParams 存在，则添加到 params 中
  };
  return api.postExport('/data/ExcelManage/importExcelConfirm', formData, {
    params, // 直接使用动态构建的 params
    headers: {
      'Content-Type': 'multipart/form-data',
      ...headers
    },
    ...restConfig
  });
}

/**
 * 列表导出
 * @param {*} data
 */
export function exportTable (data) {
  return api.jsonPost('/data/excelOperate/commonExport', data);
}

/**
 * 枚举通用接口
  * @param {*} data
  */
export function getEnum (code, size) {
  return api.jsonPost('/datacenter/web/common/commonDictValue/get', { dictType: code, pageSize: size || 200 });
}

/**
 * 根据名称或工号查询用户
 * @param {*} data
 */
export function getUserByNameOrNo (data) {
  return api.jsonPost('/accountService/user/listByNameOrEmpNo', data);
}

/**
 * 根据 userId 查询用户详情（含基础信息 + 岗位列表）
 * @param {*} id { userId }
 */
export function getUserDetailById (id) {
  return api.get('/users/manager/info/' + id);
}

/**
 * 网发门店模糊搜索
 * @param {*} data
 */
export function listOrgStoreInfo (data) {
  return api.jsonPost('/network/portal/store/page', data);
}

/**
 * 门店模糊搜索
 * @param {*} data
 */
// export function listOrgStoreInfo (data) {
//   return api.get('/accountService/orgInfo/listOrgStoreInfo', data);
// }

/**
 * 年款模糊搜索
 * @param {*} data
 */
export function listVehicleYearType (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleYearType/list', data);
}

/**
 * 维修类型模糊搜索
 * @param {*} data
 */
export function repairItemType (data) {
  return api.jsonPost('/maintain/web/basic/repairItemType/list', data);
}

/**
 * 省模糊搜索
 * @param {*}
 */
export function getProvinceTree () {
  return api.get('/area/tree');
}

/**
 * 城市模糊搜索
 * @param {*} data
 */
export function cityPage (data) {
  return api.jsonPost('/area/findPage/city', data);
}

/**
 * 物流信息查询
 * @param {*} data
 */
export function getLogistics (data) {
  return api.jsonPost('/sp/web/base/common/getLogistics', data);
}

/**
 * 整车主数据-品牌模糊搜索
 * @param {*} data
 */
export function vehicleBrandNameList (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleBrand/list', data);
}

/**
 * 销售公告车型模糊搜索
 * @param {*} data
 */
export function vehicleSalesVersionList (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleRegisteredModel/list', data);
}

/**
 * 整车主数据-车系-列表查询 只返id name
 * @param {*} data
 */
export function vehicleSeriesList (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleSeries/list', data);
}

/**
 * 整车主数据-车系-列表查询 车系详细模糊搜索
 * @param {*} data
 */
export function vehicleSeriesListFull (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleSeries/listFull', data);
}

/**
 * 整车主数据-系列-列表查询
 * @param {*} data
 */
export function vehicleModelLineList (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleModelLine/list', data);
}

/**
 * 整车主数据-车型列表查询 车型模糊搜索 id  name
 * @param {*} data
 */
export function vehicleModelList (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleModel/list', data);
}

/**
 * 车型详细模糊搜索
 * @param {*} data
 */
export function listVehicleYearTypeFull (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleModel/listFull', data);
}

/**
 * 整车主数据-外观列表查询
 * @param {*} data
 */
export function vehicleExterior (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleExterior/list', data);
}

/**
 * 整车主数据-内饰列表查询
 * @param {*} data
 */
export function vehicleInterior (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleInterior/list', data);
}

/**
 * 整车主数据-轮毂列表查询
 * @param {*} data
 */
export function vehicleWheelHub (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleWheelHub/list', data);
}

/**
 * 整车主数据-选装包列表查询
 * @param {*} data
 */
export function vehicleOptionPackage (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleOptionPackage/list', data);
}

/**
 * 整车主数据-电池电芯列表查询
 * @param {*} data
 */
export function vehicleBatteryCell (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleBatteryCell/list', data);
}

/**
 * 整车主数据-车顶列表查询
 * @param {*} data
 */
export function vehicleRoof (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleRoof/list', data);
}

/**
 * 整车主数据-续航里程管理
 * @param {*} data
 */
export function vehicleDrivingRange (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleDrivingRange/list', data);
}

/**
 * 整车主数据-续配动力列表查询
 * @param {*} data
 */
export function vehicleRangePower (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleRangePower/list', data);
}

/**
 * 整车主数据-物料列表查询
 * @param {*} data
 */
export function vehicleMaterials (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleMaterials/list', data);
}

/**
 * 仓库名称查询
 * @param {*} data
 */
export function pageWithPermission (data) {
  return api.jsonPost('/zcwms/base/headquartersWarehouse/pageWithPermission', data);
}

/**
 * 车型-年款-关联关系表列表查询
 * @param {*} data
 */
export function vehicleModelYearTypeRelation (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleModelYearTypeRelation/list', data);
}

/**
 * 车型-年款-关联关系表列表查询
 * @param {*} data
 */
export function vehicleModelYearTypeRelationDistinctYeayType (data) {
  return api.jsonPost('/datacenter/web/materials/vehicleModelYearTypeRelation/listDistinctYearType', data);
}

/**
 * 用户登录信息查询
 * @param {*} data
 */
export function loginUserGet (data) {
  return api.jsonPost('/datacenter/web/common/loginUser/get', data);
}

/**
 * 建店类型接口 级联
 * @param {*} data
 */
export function getBuildType (data) {
  return api.get('/network/portal/DataDict/getBuildType', data);
}

/**
   * 备件主数据表列表查询
   * @param {*} data
   */
export function sparePartList (data) {
  return api.jsonPost('/sp/web/basic/sparePart/listFull', data);
}

/**
   * 备件主数据表列表查询
   * @param {*} data
   */
export function sparePartListShort (data) {
  return api.jsonPost('/sp/web/basic/sparePart/list', data);
}

/**
   * 备件主数据门店备件库位表列表查询
   * @param {*} data
   */
export function locationListShort (data) {
  return api.jsonPost('/sp/web/warehouse/location/list', data);
}

/**
 * 销售顾问/交付顾问/交付衍生工程师、
 * 配置项唯一标识 salesConfigKey:
 * saleUser-销售顾问配置
 * deliveryUser-交付顾问配置
 * deliveryDerive-交付衍生工程师配置
 * -现场交付工程师配置
 * @param {*} data
 */
export function engineerList (data) {
  return api.jsonPost('vr/web/order/common/userList', data);
}

/**
   * 网发--用户仓库列表
   * @param {*} data
   */
export function getApplyUserStoreList (data) {
  return api.get('/network/portal/user/store/list', data);
}

/**
   * 网发--用户信息
   * @param {*} data
   */
export function getLoginUser (data) {
  return api.get('/passport/users/current', data);
}

/**
   * 网发--查询门店子级组织
   * @param {*} data
   */
export function getFindDescendant (data) {
  return api.get('/accountService/orgInfo/findDescendant', data);
}

// 登出
export function logout (params) {
  return api.jsonPost('/passport/users/logout', params);
}

/**
 * 网发 门店关联关系查询（单项）
 * @param {*} data
 */
export function queryStoreRelation (data) {
  return api.jsonPost('/network/portal/store/queryStoreRelation', data);
}
