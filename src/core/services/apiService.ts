import type { App } from "vue";
import axios from "axios";
import type {AxiosResponse, AxiosRequestConfig} from "axios";
import VueAxios from "vue-axios";
import GlobalConfig from "../config/globalConfig";

class ApiService {
  public static vueInstance: App;
  public static baseUrl: string;

  public static async install(app: App<Element>) {
    ApiService.vueInstance = app;  
    ApiService.vueInstance.use(VueAxios, axios);
    ApiService.vueInstance.axios.defaults.baseURL = GlobalConfig.APIServer;

    this.baseUrl = GlobalConfig.APIServer;

  }

  // get function
  public static async get(resource: string, slug = "" as string) : Promise<AxiosResponse> {
    return ApiService.vueInstance.axios
    .get(`${resource}/${slug}`)
    .catch((error) => {
      throw new Error(`ApiService ${error}`);
    });
  }

    // post function
    public static async post(resource: string, params: AxiosRequestConfig) : Promise<AxiosResponse> {
      return ApiService.vueInstance.axios
      .post(`${resource}`, params)
      .catch((error) => {
        throw new Error(`ApiService ${error}`);
      });
    }

    // update function
    public static async update(resource: string, slug: string, params: AxiosRequestConfig) : Promise<AxiosResponse> {
      return ApiService.vueInstance.axios
      .put(`${resource}/${slug}`, params)
      .catch((error) => {
        throw new Error(`ApiService ${error}`);
      });
    }

    // delete function
    public static async delete(resource: string) : Promise<AxiosResponse> {
      return ApiService.vueInstance.axios
      .delete(`${resource}`)
      .catch((error) => {
        throw new Error(`ApiService ${error}`);
      });
    }


}

export default ApiService;