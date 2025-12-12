import axiosInstance from "./helper";

const makeApiCall = (type = "get", url, payload) => {
    if (type === "post") {
        return axiosInstance.post(url, payload);
    } else if (type === "get") {
        return axiosInstance.get(url);
    } else {
        return;
    }
};

export const AppActions = {
    makeApiCall,
};
