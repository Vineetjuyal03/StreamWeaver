import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

export const fetchCollections = async () => {
    const response = await API.get('/collections');

    return response.data.collections;
};

export const fetchCollectionFields = async (collectionName) => {
    const response = await API.get(
        `/collections/${encodeURIComponent(collectionName)}/fields`
    );

    return response.data.fields;
};