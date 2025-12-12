import { message } from "antd";
import axios from "axios";

const locationPrefix = sessionStorage.getItem("site_location");
export const BASE_API = import.meta.env.VITE_API_URL
    ;
// export const BASE_API = "https://his-api-dev.yashodahospital.com";
// export const BASE_API = "https://his-beta-api.yashodahospital.com";
// export const BASE_API = "https://ircapi.lexyslabs.com";
// export const BASE_API = "https://irc-api.starof.com";
// export const BASE_URL = BASE_API + `/api/V1`;
export const BASE_URL = BASE_API + `/api/V1`;

const headers = {};
if (sessionStorage.getItem("access_token")) {
    headers.Authorization = "Bearer " + sessionStorage.getItem("access_token");
}
if (locationPrefix) {
    headers.location = locationPrefix
}
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers,
});

axiosInstance.interceptors.request.use(function (config) {
    const token = "Bearer " + sessionStorage.getItem("access_token");
    config.headers.Authorization = token;
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => {
        return new Promise((resolve, reject) => {
            resolve(response);
        });
    },
    (error) => {
        if (!error.response) {
            return new Promise((resolve, reject) => {
                reject(error);
            });
        }

        if (error.response.status === 401 || error.response.status === 403) {
            message.error("Session expired! Redirecting to login..");
            setTimeout(() => {
                sessionStorage.setItem("path_before_login", window.location.pathname);
                sessionStorage.removeItem("access_token");
                sessionStorage.removeItem("user_details");
                window.location = `/${locationPrefix}/login`;
            }, 2000);
        } else {
            return new Promise((resolve, reject) => {
                reject(error);
            });
        }
    }
);

window.axiosInstance = axiosInstance;

export default axiosInstance;
