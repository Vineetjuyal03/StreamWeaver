import axios from 'axios';
import { handleApiError } from '../utils/handleApiError';

const API = axios.create({
    baseURL: 'http://localhost:5000',
});
export const test= async()=>{
    return await API.get('/')
}
export const fetchCollections = async () => {
    try {
        const response = await axios.get('http://localhost:5000/db/collections');
        return response.data.collections;
    } catch (err) {
        const { message } = handleApiError(err);
        throw new Error(message);
    }
};

export const fetchCollectionFields = async (collectionName) => {
    try {
        const response = await API.get(`/db/collections/${encodeURIComponent(collectionName)}/fields`);
        return response.data.fields;
    } catch (err) {
        const { message } = handleApiError(err);
        throw new Error(message);
    }
};

const uploadFile = async (file, mapping, transformations = [], fileType, importId, collection) => {
    const formData = new FormData();
    formData.append('collection', collection);
    formData.append('mapping', JSON.stringify(mapping));
    formData.append('transformations', JSON.stringify(transformations));
    formData.append('importId', importId);
    formData.append('file', file);

    try {
        const response = await axios.post(`http://localhost:5000/api/import/upload/${fileType}`, formData);
        return response.data;
    } catch (err) {
        const { message } = handleApiError(err);
        throw new Error(message);
    }
};

export const uploadCSV = (file, mapping, transformations, importId, collection) =>
    uploadFile(file, mapping, transformations, 'csv', importId, collection);

export const uploadJSON = (file, mapping, transformations, importId, collection) =>
    uploadFile(file, mapping, transformations, 'json', importId, collection);
//api.js