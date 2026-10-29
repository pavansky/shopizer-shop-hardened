import axios from 'axios';
import { getLocalData } from './helper'
import env from './env';

const BASE_URL = env.API_V1;
axios.defaults.baseURL = BASE_URL

export default class WebService {


    static async post(action, params) {
        let response = await axios.post(action, params)
        return response.data
    }
    static async put(action, params) {
        let response = await axios.put(action, params)
        return response.data
    }
    static async get(action) {
        let response = await axios.get(action)
        return response.data
    }
    static async delete(action) {
        let response = await axios.delete(action)
        return response.data
    }
    static async patch(action, params) {
        let response = await axios.patch(action, params)
        return response.data
    }


}

axios.interceptors.request.use(async (config) => {
    // Do something before request is sent
    config.baseURL = BASE_URL;
    const token = await getLocalData("token");
    if (token) {
        config.headers.common['Authorization'] = 'Bearer ' + token;
    } else {
        delete config.headers.common['Authorization'];
    }
    return config;
}, (error) => {
    // Do something with request error
    return Promise.reject(error);
});


// Called once when an authenticated request is rejected with 401, so the
// app can drop the stale session. Registered from index.js.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

axios.interceptors.response.use((response) => response, (error) => {
    // Network failures, CORS rejections and timeouts carry no response.
    // Normalise them so callers can always read error.response.status.
    if (!error || !error.response) {
        const normalised = error instanceof Error ? error : new Error('Network error');
        normalised.isNetworkError = true;
        normalised.response = { status: 0, data: { message: 'The store is not reachable. Check your connection and try again.' } };
        return Promise.reject(normalised);
    }

    const { response, config } = error;
    const authHeader = config && config.headers && config.headers.Authorization;
    // A 401 on a request that carried a token means the session expired or
    // was revoked. A 401 without a token (e.g. a failed login) is left to the
    // caller.
    if (response.status === 401 && authHeader && onUnauthorized) {
        onUnauthorized();
    }
    return Promise.reject(error);
});
